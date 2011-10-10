#!/usr/bin/python
import json
import os
import sys
import fnmatch
from functools import partial
from operator import add
import re

from assets import build as build_assets

requires_re = re.compile(r"""requires\(['"]{1}([^'"]+)['"]{1}\)""")
provides_re = re.compile(r"""provides\(['"]{1}([^'"]+)['"]{1}\)""")

libstub = """
window.namespace = {};
function provides(namespace) {
    var parts = namespace.split('.'),
        part,
        current = window.namespace;
    while(part = parts.shift(0)){
        if(!(part in current)){
            current[part] = {};
        }
        current = current[part];
    }
    return current;
}
requires = provides;
"""

def mkdir(path):
    if not os.path.exists(path):
        os.makedirs(path)
    if not os.path.isdir:
        raise OSError("'%r' is not a path" % path)

def publish_debug(config, filename):
    root = os.path.abspath(config["src"])
    filename = os.path.abspath(filename)
    basename = filename[len(root)+1:]
    url = config["srcurl"] + basename
    return os.path.relpath(filename, config["build"])

def prepareconfig(config):
    base = {
            "mode": "debug",
            "src": "src",
            "build": "build",
            "provides": {},
            "requires": {},
            "globals": [],
            "entrypoints": {"main": "browser"},
    }
    base.update(config)
    for name in config["provides"].values():
        base["requires"].setdefault(name, {})
    mkdir(base["src"])
    mkdir(base["build"])
    return base

def make(configfile="build.json", target=None, mode="debug"):
    if os.path.exists(configfile):
        with open(configfile, "rb") as f:
            config = json.load(f)
    else:
        config = {}
    config = prepareconfig(config)

    provides, requires = scan(config['src'])
    provides.update(config['provides'])
    requires.update(config['requires'])

    for entrypoint, target in config["entrypoints"].items():
        required = gather_requirements(entrypoint, provides, requires)
        order = topsort(provides, required)
        handle_globals(config["globals"], order, provides)
        builder = targets[target][mode]
        builder(config, order, entrypoint)

    if "assets" in config:
        for asset_json, dirs in config["assets"].items():
            build_assets(asset_json, dirs)

def handle_globals(globals_, order, provides):
    globals_ = [provides[i] for i in globals_]
    for g in globals_:
        if g in order:
            order.remove(g)
        order.insert(0, g)

def gather_requirements(entrypoint, provides, requires):
    requirements = []
    required = {}
    dependencies = [entrypoint]
    while dependencies:
        dependency = dependencies.pop()
        try:
            name = provides[dependency]
        except KeyError:
            raise Exception("Unmet dependency %r" % dependency)
        required[name] = requires[name]
        dependencies.extend(required[name])
    return required

def build_debug_browser(config, order, entrypoint):
    with open(os.path.join(config["build"], entrypoint + ".js"), "w") as f:
        f.write(libstub)
        for name in order:
            url = publish_debug(config, name)
            f.write("document.write('<script src=\"%s\" "
                    "type=\"text/javascript\"></script>');\n" % url)

def build_release_browser(config, order, entrypoint):
    with open(os.path.join(config["build"], entrypoint + ".js"), "w") as f:
        f.write(libstub)
        for name in order:
            with open(name) as f2:
                f.write("\n// %s\n" % name)
                f.write(f2.read())
        # todo: minimize

def build_debug_qunit(config, order, filename):
    build_debug_browser(config, order, filename)

def topsort(provides, requires):
    order = []
    provided = set()
    requires = requires.copy()
    changes = True
    while changes:
        changes = False
        for filename, dependencies in requires.items():
            for dependency in dependencies:
                if not dependency in provided:
                    break
            else:
                order.append(filename)
                requires.pop(filename)
                # a bit ugly but ok
                for item, itemfilename in provides.items():
                    if itemfilename == filename:
                        changes = True
                        provided.add(item)
    if requires:
        raise Exception("Cyclical dependencies: %r" % requires)
    return order


def scanfile(filename):
    with open(filename, "rb") as f:
        data = f.read()
    requires = []
    provides = {}
    for match in requires_re.finditer(data):
        requires.append(match.group(1))
    for match in provides_re.finditer(data):
        provides[match.group(1)] = filename
    return provides, requires


def scan(srcdir):
    files = reduce(add,
            (map(partial(os.path.join, p),
                fnmatch.filter(f, "*.js"))
            for  p, d, f in os.walk(srcdir)))
    provides = {}
    requires = {}
    for filename in files:
        fprovides, frequires = scanfile(filename)
        provides.update(fprovides)
        requires[filename] = frequires
    return provides, requires


targets = {
        "browser": {
            "debug": build_debug_browser,
            "release": build_release_browser
        }
}

if __name__ == "__main__":
    if len(sys.argv) > 1:
      make(mode=sys.argv[1])
    else:
      make()
