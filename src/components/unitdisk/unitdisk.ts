import * as d3                           from 'd3'
import { HTML }                          from 'ducd'
import { N }                             from '../../models/n/n'
import { obj2data }                      from '../../models/n/n-loaders'
import { C, CktoCp, CmulR, CsubC }       from '../../hyperbolic-math'
import { dfsFlat, πify, CassignC }       from '../../hyperbolic-math'
import { ArrAddR }                       from '../../hyperbolic-math'
import { lengthDilledation }             from '../../hyperbolic-math'
import { Transformation }                from '../../hyperbolic-transformation'
import { PanTransformation }             from '../../hyperbolic-transformation'
import { NegTransformation }             from '../../hyperbolic-transformation'
import { TransformationCache }           from '../../hyperbolic-transformation'
import { HypertreeUi }                   from '../hypertree'
import { ILayer }                        from '../layerstack/layerstack'
import { NodeLayer }                     from '../layerstack/layers/node-layer'
import { LabelLayer }                    from '../layerstack/layers/text-rect-layer'
import { InteractionLayer }              from '../layerstack/layers/interaction-layer'
import { Interaction2 }                  from './interactive-unitdisk'
import { LayerStack }                    from '../layerstack/layerstack'

var bubbleSvgDef =
    `<defs>
        <radialGradient id="exampleGradient">
            <stop offset="50%"   stop-color="white"/>
            <stop offset="92%"   stop-color="#606060"/>
            <stop offset="99.8%" stop-color="#242424"/>
            <stop offset="100%"  stop-color="#232323"/>
        </radialGradient>
    </defs>`

export interface UnitDiskArgs
{
    parent:            any,
    hypertree,
    data:              N,
    layers:            ((ls:Interaction2)=> ILayer)[],

    cacheUpdate:       (interaction:Interaction2, cache:TransformationCache)=> void,
    transformation:    Transformation<N>,
    transform:         (n:N)=> C,

    caption:           (n:N)=> string,
    nodeRadius:        number,
    clipRadius?:       number
}

//----------------------------------------------------------------------------------------

var html =
    `<div class="unitdisk-nav">
        <svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" viewBox="-0 0 1000 1000">
            ${bubbleSvgDef}
            <g class="unitDisc" transform="translate(520,500) scale(470)"></g>
        </svg>
        <div class="preloader"></div>
    </div>`

export class UnitDisk
{
    args          : UnitDiskArgs
    ui            : HTMLElement & HypertreeUi

    voronoiLayout : d3.VoronoiLayout<N>
    layerStack    : LayerStack
    cache         : TransformationCache // zeigt auf transformation.cache

    constructor(args : UnitDiskArgs) {
        this.args = args
        this.ui = HTML.parse<HTMLElement & HypertreeUi>(html)()
        args.parent.appendChild(this.ui)
        args.parent = this.ui.querySelector('.unitDisc')

        this.cache = args.transformation.cache
        var mainGroup = d3.select(args.parent)

        this.voronoiLayout = d3.voronoi<N>()
            .x(d=> d.cache.re)
            .y(d=> d.cache.im)
            .extent([[-2,-2], [2,2]])
        
        mainGroup.append('clipPath')
            .attr('id', 'circle-clip' + this.args.clipRadius)
            .append('circle')
                .attr('r', this.args.clipRadius)       

        this.args.cacheUpdate(this, this.cache)
        this.layerStack = new LayerStack({
            parent: mainGroup,
            interaction: this
        })
    }

    public updateData() {        
        this.args.cacheUpdate(this, this.cache)

        this.layerStack.updateTransformation()
    }

    public updateTransformation() {
        this.args.cacheUpdate(this, this.cache)

        this.layerStack.updateTransformation()
    }

    public updateSelection() {
        this.layerStack.updatePath()
    }
}

//----------------------------------------------------------------------------------------

var htmlnav =
    `<div class="unitdisk-nav">
        <svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" viewBox="-0 0 1000 1000">            
            ${bubbleSvgDef}
            <g class="unitDisc"            transform="translate(500,500) scale(440)"></g>            
            <g class="nav-parameter-disc"  transform="translate(120,120) scale(60)"></g>        
            <g class="nav-background-disc" transform="translate(120,120) scale(60)"></g>                         
        </svg>
        <div class="preloader"></div>
    </div>`

export class UnitDiskNav
{
    args          : UnitDiskArgs
    ui 
    interaction   : Interaction2

    view          : Interaction2
    navBackground : Interaction2
    navParameter  : Interaction2

    constructor(args : UnitDiskArgs) {
        this.args = args
        this.ui = HTML.parse<HTMLElement & HypertreeUi>(htmlnav)()
        args.parent.appendChild(this.ui)

        args.parent = this.ui.querySelector('.unitDisc')    
        this.view = new Interaction2(args)

        this.navBackground = new Interaction2({
            parent:             this.ui.querySelector('.nav-background-disc'),
            hypertree:          args.hypertree,
            data:               args.data,
            layers:             args.layers.filter((l, idx)=> 
                                    idx !== 1 && idx !== 2 && idx !== 4 && idx !== 5 && idx !== 7),
            cacheUpdate:        args.cacheUpdate,
            transformation:     args.transformation,
            transform:          (n:N)=> n.z,

            caption:            (n:N)=> undefined,
            nodeRadius:         .012,
            clipRadius:         1
        })

        var navTransformation =
            new NegTransformation(
                new PanTransformation(args.transformation.state))
        var rotate = d=>
            (d.name === 'λ' ? ' rotate(-30)' : ' rotate(0)')
        var Pscale =  ls=> d=>
            lengthDilledation(d)
            * (1 - πify(CktoCp(ls.args.transformation.state.λ).θ) / 2 / Math.PI)
            / ls.args.nodeRadius

        this.navParameter = new Interaction2({
            parent:             this.ui.querySelector('.nav-parameter-disc'),
            hypertree:          args.hypertree,
            data:               obj2data(args.transformation.state),
            layers:             [
                                    (ls:Interaction2)=> new NodeLayer({
                                        name:        'nodes',
                                        data:        ()=> ls.cache.unculledNodes,
                                        r:           d=> ls.args.nodeRadius * (d.name==='P' ? Pscale(ls)(d) : 1),
                                        transform:   d=> d.transformStrCache,
                                    }),
                                    (ls:Interaction2)=> new LabelLayer({
                                        data:        ()=> ls.cache.unculledNodes,
                                        text:        d=> ({ P:'+', θ:'🗘', λ:'⚲' })[d.name],
                                        delta:       d=> ({ re:.0025, im:.025 }),
                                        transform:   d=> d.transformStrCache + rotate(d)
                                    }),
                                    (ls:Interaction2)=> new InteractionLayer({                                        
                                        unitdisk:    ls,
                                        mouseRadius: 1.5,
                                        onClick:     (n:N, m:C)=> {}
                                    })
                                ],
            cacheUpdate:        (interaction:Interaction2, cache:TransformationCache)=> {
                                    cache.unculledNodes = dfsFlat(interaction.args.data)
                                    for (var n of cache.unculledNodes) {
                                        n.cache = n.cache || { re:0, im:0 }
                                        var np = interaction.args.transform(n)
                                        if (n.name == 'θ' || n.name == 'λ')
                                            np = CmulR(np, 1.08)
                                        CassignC(n.cache, np)

                                        n.cachep            = CktoCp(n.cache)
                                        n.strCache          = n.cache.re + ' ' + n.cache.im
                                        n.scaleStrText      = ` scale(1)`
                                        n.transformStrCache = ` translate(${n.strCache})`
                                    }
                                    try { cache.voronoiDiagram = interaction.voronoiLayout(cache.unculledNodes) } catch(e) {}
                                },
            transformation:     navTransformation,
            transform:          (n:any)=> CmulR(n, -1),

            caption:            (n:N)=> undefined,
            nodeRadius:         .21,
            clipRadius:         1.5
        })
    }

    public updateData() {
        this.navBackground.args.data = this.args.data
        this.view.args.data = this.args.data

        this.navBackground.updatePositions()
        this.view.updatePositions()
        this.navParameter.updatePositions()
    }

    public updateTransformation() {
        this.view.updatePositions()
        this.navParameter.updatePositions()
    }
    public updateSelection() {
        this.view.updateSelection(); /*navBackground.updateSelection();*/
    }        
}


