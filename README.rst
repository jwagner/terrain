WebGL Terrain Rendering Experiment
==================================

This is an experiment in rendering terrain using WebGL.
It is using CDLOD [1]_ for handling level of details.
The demo does also include reflective water using oblique
view frustums [2]_ for clipping. The code is quite hacky,
and probably not suitable for use in a real world application.
It does not do any streaming at the moment, so it requires all the
data to reside in one big texture. I might build on this experiment
in the future.

Conclusions
===========

CDLOD does work well using WebGL. It results in smooth level of detail changes.
The main drawback is that it requires quite a lot of draw calls.


.. [1]_ http://www.vertexasylum.com/downloads/cdlod/cdlod_latest.pdf
.. [2]_ http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
