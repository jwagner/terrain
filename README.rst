WebGL Terrain Rendering Experiment
==================================

This is an experiment in rendering terrain using WebGL.
It is using CDLOD [1]_ for handling level of details.
The demo does also include reflective water using oblique
view frustums [2]_ for clipping. The code is quite hacky (an experiment
that got out of hand), and is probably not suitable for use in any real
world application.
It does not do any streaming at the moment, so it requires all the
data to reside in one big texture. I might build on this experiment
in the future.

Notes
=====

Most of the relevant code is in **src/engine/terrain.js**
Note that that code does currently not handle nodes whose distance is
bigger than the max distance and there are probably more rough edges too.

Conclusions
===========

CDLOD does work well using WebGL. It results in smooth level of detail changes.
The main drawback is that it requires quite a lot of draw calls.


.. [1]_ http://www.vertexasylum.com/downloads/cdlod/cdlod_latest.pdf
.. [2]_ http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
