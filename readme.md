<!--
<p align="justify">
<p align="center">
<a href="https://glouwa.github.io/d3-hypertree/">
  <img src="docs/img/screenshot-light-github.png?raw=true">
</a>
</p>
</p>
-->

<!--
<iframe width="590" height="590" src="https://glouwa.github.io/" frameborder="0" allowfullscreen="allowfullscreen"></iframe>

<iframe width="560" height="315" src="http://www.youtube.com/embed/t6kxOXOJj8E" frameborder="0" allowfullscreen="allowfullscreen"></iframe>
-->

# D3-Hypertree
<!--
<p align="justify">
<p align="center">
A Scalable Intercative Web Component for Hyperbolic Tree Visualisations.
</p>
</p>
-->

<a href="https://glouwa.github.io/d3-hypertree/"><img 
src="docs/img/screenshot-light-github.png?raw=true" width="170" align="left" hspace="10" vspace="16"></a>

- Scalable up to 1000 nodes
- Scalable up to 50k nodes with weight culling and primeter culling
- Configurable mouse and touch interaction
- Configurable layers, visualisation presets
- Uses same data format as [d3.hierarchy()](https://github.com/d3/d3-hierarchy#hierarchy) 
- Alternatively file loaders for csv, json, skos, treeml are available
<br>

## Resources
- [API Reference](https://glouwa.github.io/d3-hypertree/)
- [Live Demos](https://glouwa.github.io/d3-hypertree-examples/)
- [HTML / Webpack / Python Examples](https://github.com/glouwa/d3-hypertree-examples/)

## Installation

```bash
npm install d3-hypertree --save
```

<b>Or</b> download the [latest release](https://glouwa.github.io/d3-hypertree/)
of the prebuild bundle if npm is not used, 
and add the following lines to your page:

```html
<link  href="index-browser-light.css" rel="stylesheet">
<script src="d3-hypertree.js"></script>
```

The prebuild bundle declares the global variable `hyt`, 
therefore a import as in the usage example below is not necessary.
You can find the prebuild bundle also in the npm package `dist` folder. 

## Webpack

D3-hypertree is tested with webpack. 
You may use imports in a diffent way,
but the following usage examples will assume an import like this:  

```typescript
import * as hyt from 'd3-hypertree'
```

## Usage

Parent DOM element and data source are the only configuration parameters required.

```typescript
new hyt.Hypertree(
    {
        parent: document.body,        
    },
    {
        model: hyt.loaders.fromFile('data/LDA128-ward.d3.json'),
    }
)
```

See [API Reference](https://glouwa.github.io/d3-hypertree/) or cheat sheet below for additional options.

## Options Cheat Sheet

This example shows a component instantiation using most features. For detailed descriptions and a complete list of features see 
[API Reference](https://glouwa.github.io/d3-hypertree/).

```typescript
new hyt.Hypertree(
    {
        id:                     'my-component',
        classes:                'add-class another-class',
        parent:                 document.body,        
        preserveAspectRatio:    'xMidYMid meet'
    },
    {
        dataloader?:            LoaderFunction   
        dataInitBFS:            (ht:Hypertree, n:N)=> void       // emoji, imghref
        langInitBFS:            (ht:Hypertree, n:N)=> void       // text, wiki, clickable, cell,
        objects: {
            roots:              N[]
            pathes:             Path[]
            selections:         N[]    
        }
        layout: {
            type:               LayoutFunction
            weight:             (n:N)=> number
            initSize:           number
            rootWedge: {
                orientation:    number
                angle:          number
            }
        }
        filter: {
            cullingRadius:      number
            weightFilter:       null | number | {            
                weight:         (n)=> number
                rangeWeight:    { min:number, max:number }
                rangeNodes:     { min:number, max:number }
                alpha:          number
            }
            focusExtension:     number
            maxFocusRadius:     number
            wikiRadius:         number
            maxlabels:          number       
        }       
        geometry: {        
            layers:            ((v, ls:IUnitDisk)=> ILayer)[]
            layerOptions:      {
                cells: {
                    invisible:  false,
                    hideOnDrag: false,
                    // + layer specific properties 
                },
            }
            nodeRadius:        (ud:IUnitDisk, n:N)=> number
            nodeScale:         (n:N)=> number
            nodeFilter:        (n:N)=> boolean
            offsetEmoji:       (d, i, v)=> C
            offsetLabels:      (d, i, v)=> C

            captionBackground: 'all' | 'center' | 'root' | 'none' // x 
            captionFont:       string
            captionHeight:     number

            linkWidth:         (n:N)=> number
            linkCurvature:     ArcCurvature
        }
        interaction: {          
            //type:               'clickonly' | 'selction' | 'multiselection' | centernodeselectable'
            mouseRadius:        number,
            onNodeSelect:       (n:N)=> void
            onNodeHold:         ()=>void                          // x 
            onNodeHover:        ()=>void                          // x 
            λbounds:            [ number, number ]
            wheelSensitivity:   number
        }
    }
)
```
