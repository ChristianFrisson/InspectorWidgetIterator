# InspectorWidget Iterator

## Introduction

InspectorWidget is an opensource suite to track and analyze users behaviors in their applications. 

The key contributions of InspectorWidget are:
1) it works on closed applications that do not provide source code nor scripting capabilities; 
2) it covers the whole pipeline of software analysis from logging input events to visual statistics through browsing and programmable annotation; 
3) it allows post-recording logging; and 4) it does not require programming skills. To achieve this, InspectorWidget combines low-level event logging (e.g. mouse and keyboard events) and high-level screen features (e.g. interface widgets) captured though computer vision techniques. 

InspectorWidget is targeted at end users, usability experts, user experience and HCI researchers.

## Distribution

[InspectorWidget](https://github.com/InspectorWidget/InspectorWidget) is composed of three tools:
- [Collector](https://github.com/InspectorWidget/InspectorWidgetCollector): Record (screen), Log (input events) 
- [Iterator](https://github.com/InspectorWidget/InspectorWidgetIterator): Browse (screen + input events), Program (annotations), Analyze (workflows)
- [Processor](https://github.com/InspectorWidget/InspectorWidgetProcessor): Automate (annotations)

### InspectorWidget Iterator

The Iterator tool is a web-based application for browsing the recordings of screen and input events, programming annotations and analyzing workflows. 

It is based on:
- [dc-js](https://github.com/dc-js) / [dc.js](https://github.com/dc-js/dc.js): a library for multi-dimensional charting
- [google](https://github.com/google) / [blockly](https://github.com/google/blockly): a library for visual programming implementing Scratch
- [ina-foss](https://github.com/ina-foss) / [amalia.js](https://github.com/ina-foss/amalia.js): a library for browsing spatial/temporal annotations synchronized with video playback
- [mbostock](https://github.com/mbostock) / [d3](https://github.com/mbostock/d3): a library for information visualization
- [square](https://github.com/square) / [crossfilter](https://github.com/square/crossfilter): a library for fast n-dimensional filtering and grouping of records

## Installation

First clone the repository.
Then open a terminal in the source directory:
* prepare front-end packages with bower: `bower install`
* install node.js dependencies with npm: `npm install`
* compile the JavaScript code with grunt: `grunt`

## License

InspectorWidget Iterator is released under the terms of the [GPLv3](http://www.gnu.org/licenses/gpl-3.0.html) license.

## Authors
 * [Christian Frisson](http://christian.frisson.re) (University of Mons): creator and main developer
 * [Gilles Bailly](http://www.gillesbailly.fr) (LTCI, CNRS, Télécom-ParisTech): contributor
 * [Sylvain Malacria](http://www.malacria.fr) (INRIA Lille): contributor