import * as d3              from 'd3'
import { ILayer }           from '../index'
import { N }                from '../../../models/n/n'
import { C, CptoCk, CktoCp,
    CassignC, ArrtoC,
    dfsFlat, CsubC,
    arcCenter, πify,
    sigmoid }               from '../../../hyperbolic-math'


export interface InteractionLayerArgs
{
    unitdisk    
}

export class InteractionLayer implements ILayer
{
    name: string
    args: InteractionLayerArgs    
    updateData =      ()=> {}
    updateTransform = ()=> {}
    updateColor =     ()=> {}

    cache

    constructor(args : InteractionLayerArgs) {        
        this.args = args
        this.name = 'interaction'

        this.cache = args.unitdisk.cache
        this.args.hypertree = args.unitdisk.args.hypertree
        this.args.transformation = args.unitdisk.args.transformation
        this.args.mouseRadius = args.unitdisk.args.mouseRadius
        this.args.onClick = args.unitdisk.args.onClick
    }

    public attach(parent) {
        this.args.parent = parent        
        this.mainGroup = this.args.parent
        this.initMouseStuff()
    }

    private initMouseStuff(parent) {
        this.currMousePosAsArr = ()=> d3.mouse(this.args.parent._groups[0][0])
        this.currMousePosAsC = ()=> ArrtoC(this.currMousePosAsArr())
        var findNodeByCell = ()=> {
            var m = this.currMousePosAsArr()
            var find = this.cache.voronoiDiagram.find(m[0], m[1])
            return find ? find.data : undefined
        }

        var dragStartPoint = null
        var dragStartElement = null
        var drag = d3.drag()
            //.filter(()=> console.log(d3.event.type); return true; )
            .on("start", ()=> this.onDragStart(
                dragStartElement = findNodeByCell(),
                dragStartPoint = this.currMousePosAsC()
            ))
            .on("end",   ()=> this.onDragEnd(
                dragStartElement,
                dragStartPoint,
                this.currMousePosAsC()
            ))
            .on("drag",  ()=> this.onDragByNode(
                dragStartElement,
                dragStartPoint,
                this.currMousePosAsC()
            ))

        var zoom = d3.zoom()
            .scaleExtent([.51, 1.49])
            .filter(()=> d3.event.type=='wheel')
         /*   .filter(()=> {
                return d3.event.type=='wheel'
                //console.log(d3.event.touches && d3.event.touches.length == 2)
                return d3.event.type=='wheel'// || ( d3.event.touches && d3.event.touches.length == 2)

                //return d3.event.type==='wheel' //|| d3.event.type!=='touchstart'
                //return d3.event.type!=='dblclick' && d3.event.type!=='mousedown'
                //return d3.event.type!=='dblclick' || d3.event.type=='touchstart'//&& d3.event.type!=='mousedown' && d3.event.type!=='touchstart'
            })*/
            .on("zoom", ()=> this.onDragλ(
                null,
                CptoCk({ θ:d3.event.transform.k * Math.PI*2-Math.PI, r:1 }),
            ))

        // svg elements -------------------------------------------------------------------
          
        this.mainGroup.append('circle')
            .attr("class", "mouse-circle")
            .attr("r", this.args.mouseRadius)
            .on("dblclick",  d=> this.onDblClick(findNodeByCell()))
            //.on("click",     d=> this.onClick(findNodeByCell()))
            .on("mousemove", d=> this.args.hypertree.updatePath('isHovered', findNodeByCell()))
            .on("mouseout",  d=> this.args.hypertree.updatePath('isHovered', undefined))
            .call(drag)
            .call(zoom)
    }

    //-----------------------------------------------------------------------------------------

    private onDragStart = (n:N, m:C)=> {
        if (!this.animationTimer)
            this.args.transformation.onDragStart(m)
    }

    private onDragλ = (s:C, e:C)=> {
        this.args.transformation.onDragλ(s, e)
        this.args.hypertree.updateLayout()
    }

    private onDragByNode = (n:N, s:C, e:C)=> {
        if (n && n.name == 'θ') {
            this.args.transformation.onDragθ(s, e)
            this.args.hypertree.updateTransformation()
        }
        else if (n && n.name == 'λ') {
            this.onDragλ(s, e)
        }
        else {
            this.args.transformation.onDragP(s, e)
            this.args.hypertree.updateTransformation()
        }
    }

    private onDragEnd = (n:N, s:C, e:C)=> {
        var dc = CsubC(s, e)        
        var dist = Math.sqrt(dc.re*dc.re + dc.im*dc.im)
        
        if (dist < .006)
            this.onClick(n, e) // sollte on click sein und auch timer berücksichtigen oder?        
    }

    private animationTimer = null
    private cancelAnimationTimer = ()=> { 
        this.animationTimer.stop(); this.animationTimer = null 
    }
    private animateTo(n:N, m:C) : void
    {
        if (this.animationTimer)
            return

        this.onDragStart(n, m)

        var md = CktoCp(m), initR = md.r, step = 0, steps = 20
        this.animationTimer = d3.timer(()=> {            
            md.r = initR * (1 - sigmoid(step++/steps))
            if (step > steps) 
                this.cancelAnimationTimer()            
            else  
                this.onDragByNode(null, m, CptoCk(md))
        },1)
    }

    //-----------------------------------------------------------------------------------------

    private dblClickTimer = null
    private cancelClickTimer = ()=> {
        clearTimeout(this.dblClickTimer); this.dblClickTimer = null 
    }
    private onClick = (n:N, m) => {
        if (d3.event && d3.event.preventDefault) d3.event.preventDefault()
        m = m || this.currMousePosAsC()

        if (!this.dblClickTimer) 
            this.dblClickTimer = setTimeout(() => {
                this.dblClickTimer = null
                
                //this.args.onClick(d, m)
                this.animateTo(n, m)
            },
            300)
        else 
            this.cancelClickTimer()
    }

    private onDblClick = (n:N) => {
        d3.event.preventDefault()
        var m = this.currMousePosAsC()

        this.cancelClickTimer()
        //this.animateTo(n, ArrtoC(d3.mouse(this.args.parent)))
        this.args.onClick(n, m)
    }
}
