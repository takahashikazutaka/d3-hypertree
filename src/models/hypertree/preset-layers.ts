import { N }                        from '../n/n'
import { C, CptoCk, CktoCp, πify }  from '../transformation/hyperbolic-math'
import { CaddC, CsubC, CmulR }      from '../transformation/hyperbolic-math'
import { UnitDisk }                 from '../../components/unitdisk/unitdisk'
import { NodeLayer }                from '../../components/layers/node-layer'
import { CellLayer }                from '../../components/layers/cell-layer'
import { BackgroundLayer }          from '../../components/layers/background-layer'
import { SymbolLayer }              from '../../components/layers/symbol-layer'
import { ArcLayer }                 from '../../components/layers/link-layer'
import { LabelLayer }               from '../../components/layers/label-layer'
import { LabelForceLayer }          from '../../components/layers/label-force-layer'
import { InteractionLayer }         from '../../components/layers/interaction-layer'
import { InteractionLayer2 }        from '../../components/layers/interaction-layer-2'
import { TraceLayer }               from '../../components/layers/trace-layer'
import { ImageLayer }               from '../../components/layers/image-layer'
import { FocusLayer }               from '../../components/layers/focus-layer'
import { StemLayer }                from '../../components/layers/stem-layer'
import { bboxOffset }               from '../../d3-hypertree'

export const labeloffsets = {
    nodeRadiusOffset:   (ls:UnitDisk)=> (d:N)=> CptoCk({ θ:d.cachep.θ, r:ls.args.nodeRadius(ls, d)*2 }),
    centerOffset:       (ud)=> (d, i, v)=>      CmulR(bboxOffset(d)(v[i]), 1/2),
    labeloffset:        (ud)=> (d, i, v)=>      CaddC(
                                                    labeloffsets.nodeRadiusOffset(ud)(d),
                                                    bboxOffset(d)(v[i])
                                                ),
    outwards:                                   undefined,
    outwardsPlusNodeRadius:                     undefined
}
labeloffsets.outwards = labeloffsets.nodeRadiusOffset
labeloffsets.outwardsPlusNodeRadius = labeloffsets.labeloffset

export const layerSrc = [    
    // nodes
    // nodes-leafs
    // nodes-lazy
    // bounds (lambda, P)    
    // wedges
    // weight circle (radius)
    // weight cell (color)
    // interaction-d3
    // interaction-hammer
    (v, ud:UnitDisk)=> new BackgroundLayer(v, {}),    
    (v, ud:UnitDisk)=> new CellLayer(v, {
        invisible:  true,
        hideOnDrag: true,
        clip:       '#circle-clip' + ud.args.clipRadius,
        data:       ()=> ud.cache.cells,                            
    }),
    (v, ud:UnitDisk)=> new FocusLayer(v, {        
        invisible:  true,
        hideOnDrag: true,
        name:       'culling-r',        
        r:          ()=> ud.view.hypertree.args.filter.cullingRadius,
        center:     ()=> '0 0'
    }),
    (v, ud:UnitDisk)=> new FocusLayer(v, {
        invisible:  true,
        hideOnDrag: true,
        name:       'mouse-r',
        r:          ()=> ud.view.hypertree.args.interaction.mouseRadius,
        center:     ()=> '0 0'
    }),
    (v, ud:UnitDisk)=> new FocusLayer(v, {
        invisible:  true,
        hideOnDrag: true,
        name:       'focus-r',
        r:          ()=> ud.cache.focusR,
        center:     ()=> '0 0'
    }),    
    (v, ud:UnitDisk)=> new FocusLayer(v, {        
        invisible:  true,
        hideOnDrag: true,
        name:       'labels-r-𝐖',
        r:          ()=> ud.view.hypertree.args.filter.wikiRadius,
        center:     ()=> '0 0'
    }),    
    (v, ud:UnitDisk)=> new FocusLayer(v, {
        invisible:  false,
        hideOnDrag: false,
        name:       'λ',
        r:          ()=> ud.args.transformation.state.λ,
        center:     ()=> `${(ud.pinchcenter  || {re:0}).re} ${(ud.pinchcenter || {im:0}).im}`
    }),
    (v, ud:UnitDisk)=> new FocusLayer(v, {        
        invisible:  false,
        className:  'zerozero-circle',
        name:       '(0,0)',
        r:          ()=> .004,
        center:     ()=> '0 0'
    }),

    // CIRCLE STUFF END

    (v, ud:UnitDisk)=> new NodeLayer(v, {
        invisible:  true,
        hideOnDrag: true,
        name:       'weigths',
        className:  'weigths',
        data:       ()=> ud.cache.weights,
        r:          d=> ud.args.nodeRadius(ud, d),
        transform:  d=> d.transformStrCache 
                        + ` scale(${ud.args.nodeScale(d)})`,
    }),
    (v, ud:UnitDisk)=> new NodeLayer(v, {
        invisible:  true,
        hideOnDrag: true,
        name:       'wedges',
        className:  'wedges',
        data:       ()=> ud.cache.weights,
        r:          d=> ud.args.nodeRadius(ud, d),
        transform:  d=> d.transformStrCache 
                        + ` scale(${ud.args.nodeScale(d)})`,
    }),
    (v, ud:UnitDisk)=> new NodeLayer(v, {                            
        invisible:  true,
        hideOnDrag: true,
        name:       'center-node',
        className:  'center-node', 
        //clip:       '#node-32-clip', centernode.id
        data:       ()=> ud.cache.centerNode?[ud.cache.centerNode]:[],
        r:          d=> .1,
        transform:  d=> d.transformStrCache                            
                        + ` scale(${ud.args.nodeScale(d)})`,
    }),

    // links 

    (v, ud:UnitDisk)=> new ArcLayer(v, {
        invisible:  false,
        hideOnDrag: false,
        name:       'path-arcs',
        className:  'arc',
        curvature:  ud.view.hypertree.args.geometry.linkCurvature, // + - 0 l        
        data:       ()=> ud.cache.paths,                            
        nodePos:    n=> n.cache,
        nodePosStr: n=> n.strCache,
        width:      d=> ud.args.linkWidth(d) + (.013 * d.dampedDistScale),
        classed:    s=> s.classed("hovered-path",  d=> d.pathes && d.pathes.isPartOfAnyHoverPath)
                         .classed("selected-path", d=> d.pathes && d.pathes.isPartOfAnySelectionPath)
                         .style("stroke",          d=> d.pathes && d.pathes.finalcolor)
    }),
    (v, ud:UnitDisk)=> new ArcLayer(v, {
        invisible:  false,
        hideOnDrag: false,
        name:       'link-arcs',                            
        className:  'arc',
        curvature:  ud.view.hypertree.args.geometry.linkCurvature, // + - 0 l
        clip:       '#circle-clip' + ud.args.clipRadius,
        data:       ()=> ud.cache.links,                            
        nodePos:    n=> n.cache,
        nodePosStr: n=> n.strCache,
        width:      d=> ud.args.linkWidth(d),
        classed:    (s, w)=> s
                         .classed("hovered",   d=> d.pathes && d.pathes.isPartOfAnyHoverPath)
                         .classed("selected",  d=> d.pathes && d.pathes.isPartOfAnySelectionPath)                         
                         .style("stroke",      d=> d.pathes && d.pathes.finalcolor)
                         //.attr("stroke-width", d=> w(d))
    }),
    (v, ud:UnitDisk)=> new StemLayer(v, {
        invisible:  false,
        hideOnDrag: false,
        name:       'stem-arc',                            
        className:  'arc',
        curvature:  '+',
        clip:       '#circle-clip' + ud.args.clipRadius,
        data:       ()=> [],
        nodePos:    n=> n.cache,
        nodePosStr: n=> n.strCache,
        width:      d=> ud.args.linkWidth(d) + .001,
        classed:    (s, w)=> s
                         .classed("hovered",   d=> d.pathes && d.pathes.isPartOfAnyHoverPath)
                         .classed("selected",  d=> d.pathes && d.pathes.isPartOfAnySelectionPath)
                         .style("stroke",      d=> d.pathes && d.pathes.finalcolor)
                         .attr("stroke-width", d=> w(d)), 
        classed2:   (s, w)=> s
                         .classed("hovered-path",  d=> d.pathes && d.pathes.isPartOfAnyHoverPath)
                         .classed("selected-path", d=> d.pathes && d.pathes.isPartOfAnySelectionPath)
                         .style("stroke",          d=> d.pathes && d.pathes.finalcolor)
                         .attr("stroke-width", d=> w(d) + 
                            (((d.pathes && d.pathes.isPartOfAnySelectionPath) || 
                              (d.pathes && d.pathes.isPartOfAnyHoverPath)) ? .015 : 0)), 
    }),

    // nodes

    (v, ud:UnitDisk)=> new NodeLayer(v, {        
        invisible:  false,
        hideOnDrag: true,
        name:       'nodes',
        className:  'node',
        data:       ()=> ud.cache.leafOrLazy,
        r:          d=> ud.args.nodeRadius(ud, d),        
        transform:  d=> d.transformStrCache                            
                        + ` scale(${ud.args.nodeScale(d)})`,
    }),             
    
    // IMAGE LABLE SYMBOL EMOJI

    (v, ud:UnitDisk)=> new SymbolLayer(v, {
        invisible:  false,
        hideOnDrag: false,
        name:       'symbols',
        data:       ()=> ud.cache.spezialNodes,        
        transform:  d=> d.transformStrCache 
                        + ` scale(${d.dampedDistScale})`,
    }),
    (v, ud:UnitDisk)=> new ImageLayer(v, {
        name:       'images',
        data:       ()=> ud.cache.images,
        imagehref:  (d)=> d.precalc.imageHref,
        delta:      (d)=> CmulR({ re:-.025, im:-.025 }, d.distScale),
        transform:  (d, delta)=> 
                        ` translate(${d.cache.re + delta.re} ${d.cache.im + delta.im})` 
                        + ` scale(${d.distScale})`
    }),
    (v, ud:UnitDisk)=> new LabelLayer(v, {
        name:       'emojis',  
        className:  'caption',                          
        data:       ()=> ud.cache.emojis,
        text:       (d)=> d.precalc.icon,
        delta:      labeloffsets.centerOffset(ud), //(d, i, v)=> ({ re:0, im:0 }),
        transform:  (d, delta)=> 
                        ` translate(${d.cache.re + delta.re} ${d.cache.im + delta.im})` 
                        + `scale(${d.dampedDistScale*2})`
    }),
    (v, ud:UnitDisk)=> new LabelLayer(v, {
        invisible:  false,
        hideOnDrag: false,
        name:       'labels',
        className:  'caption',
        data:       ()=> ud.cache.labels,
        text:       (d)=> d.precalc.label,
        delta:      labeloffsets.labeloffset(ud),
        transform:  (d, delta)=> 
                        ` translate(${d.cache.re + delta.re} ${d.cache.im + delta.im})` 
                        + d.scaleStrText                            
    }),
    (v, ud:UnitDisk)=> new LabelForceLayer(v, {                            
        invisible:  true,
        hideOnDrag: true,                            
        name:       'labels-force',
        className:  'caption caption-label',
        data:       ()=> ud.cache.labels,
        text:       (d)=> d.precalc.label,        
        transform:  (d, delta)=> 
                        ` translate(${d.cache.re + delta.re} ${d.cache.im + delta.im})` 
                        + d.scaleStrText                            
    }),    
    (v, ud:UnitDisk)=> new InteractionLayer(v, {    
        invisible:  true,
        hideOnDrag: true,                        
        mouseRadius: ud.view.hypertree.args.interaction.mouseRadius,       
        onClick:     (n:N, m:C)=> {
                        var s = n.ancestors().find(e=> true)               // obsolete
                        //ud.args.hypertree.updatePath('SelectionPath', s) // toggle selection 
                        ud.view.hypertree.api.toggleSelection(s)           // toggle selection 
                        ud.view.hypertree.args.interaction.onNodeSelect(s) // focus splitter
        }
    }),
    (v, ud:UnitDisk)=> new InteractionLayer2(v, {                            
        mouseRadius: ud.view.hypertree.args.interaction.mouseRadius,        
        onClick:     (n:N, m:C)=> {
                        var s = n.ancestors().find(e=> true)               // obsolete
                        //ud.args.hypertree.updatePath('SelectionPath', s) // toggle selection 
                        ud.view.hypertree.api.toggleSelection(s)           // toggle selection 
                        ud.view.hypertree.args.interaction.onNodeSelect(s) // focus splitter
        }
    }),
    (v, ud:UnitDisk)=> new TraceLayer(v, {  
        invisible:    true,
        hideOnDrag:   true,
        name:         'traces',
        data:         ()=> ud.view.hypertree.args.objects.traces        
    })
]