import { Tree } from "./n-tree"
import { N } from './n'
import { stratify } from 'd3-hierarchy'
import { request, json, csv } from 'd3-request'

// todo loader MUSS ein generic sein
export type LoaderFunction = (ok: (root:N, t0:number, dl:number)=>void)=> void

function oneNode(ok) {
    ok({
        parent:null,
        children:[],
        data:{}
    })
}

function path(ok, max) {
    oneNode(d=> {
        var cur = d
        for (var i=0; i < max; i++) {
            var newN = { parent:d, children:[] }
            cur.children.push(newN)
            cur = newN
        }
        ok(d)
    })
}

function star(ok, max) {
    oneNode(d=> {
        for (var i=0; i < max-1; i++)
            d.children.push({ parent:d, children:[] })
        ok(d)
    })
}
function loadFromLangFile(ok, file) {
    //json(file, (error, langData) =>
    //    ok(langData))
    var t0, dl
    request(file)
        .mimeType("application/json")
        .response(xhr=> { 
            t0 = performance.now()
            dl = xhr.responseText.length
            return JSON.parse(xhr.responseText)
        })
        .get((error, langData) => ok(langData, t0, dl))
}

function loadFromFile(ok, file) {
    if (file.endsWith('.xml') ||
        file.endsWith('.json') ||
        file.endsWith('.rdf'))
        if (file.endsWith('.d3.json') || file == "data/upload/user-uploaded.xml") {
            var t0, dl
            request(file)
                .mimeType("application/json")
                .response(xhr=> { 
                    t0 = performance.now()
                    dl = xhr.responseText.length
                    return JSON.parse(xhr.responseText)
                })
                .get((error, treeData) => ok(treeData, t0, dl))
        }
        else
            new Tree(ok, file)
    else
        csv(file, function(error, data) {
            if (error)
                throw error;
            ok(stratify()
                .parentId((d:N)=> d.id.substring(0, d.id.lastIndexOf(".")))
                (data))
        })
}

function loadFromData(ok, data) {    
    const t0 = performance.now()
    const dl = 0
    ok(data, t0, dl)
}

export var path_ =        len=> ok=> path(ok, len)
export var star_ =        degree=> ok=> star(ok, degree)
export var fromFile =     f=> ok=> loadFromFile(ok, f)
export var fromData =     f=> ok=> loadFromData(ok, f)
export var fromLangFile = f=> ok=> loadFromLangFile(ok, f)

export function nTreeAtFirst(ok, max=75, deg=6) {
    oneNode(d=> {
        var cur = d
        for (var i=0; i < max; i++) {
            for (var j=0; j<deg; j++) {
                var newN = { parent:d, children:[] }
                cur.children.push(newN)
            }
            cur = cur.children[deg/2]
        }
        ok(d)
    })
}

export function nTree(ok, depth=14, childs=2) {
    oneNode(d=> {
        function processNode(parent, l)
        {
            if (l>=depth) return
            for (var i=0; i<childs; i++) {
                var newN = { parent:parent, children:[] }
                parent.children.push(newN)
                processNode(newN, l+1)
            }
        }
        processNode(d, 0)
        ok(d)
    })
}

export function deepStar(ok, arms=4, depth=30) {
    oneNode(d=> {
        for (var i=0; i < arms; i++) {
            var l1 = { parent:d, children:[] }
            d.children.push(l1)
            var cur = l1
            for (var j=0; j < depth; j++) {
                var newN = { parent:d, children:[] }
                cur.children.push(newN)
                cur = newN
            }
        }
        ok(d)
    })
}

/**
 * special tactics loader for navDisks
 * generates a path containing nodes for each member of 'o'
 *
 * no new object created, o is extended by tree stuff.
 */
export function obj2data(o)
{
    var mergeId = 1
    var cur = null
    var root = null    
    for (var name in o) {
        var newN = o[name]
        newN.mergeId = mergeId++
        newN.precalc = {}
        newN.name = name
        //newN.parent = cur
        newN.children = []

        if (cur)
            cur.children.push(newN)
        else
            root = newN
        cur = newN
    }
    return root
}

export function navdata() : any
{
    const createNode = (id:number, name:string)=> ({        
        mergeId:  id,
        name:     name,
        precalc:  {},
        children: []
    })
    const root =       createNode(1, 'P')
    root.children.push(createNode(2, 'θ'))
    root.children.push(createNode(3, 'λ'))
    return root
}

/**
 * creates node object for each namespace, and type
 */
function type2data(o, name)
{
    var root = { name:name, children:[] }
    for (var n in o)
        root.children.push(type2data(o[n], n))

    return root
}

export function code(ok)
{
    ok(type2data({ a:{ b:{}, c:{} }}/*ivis*/, 'ivis'))
}

export namespace generators
{
//    export var star5 = star_(5)
//    export var star51 = star_(50)
    export var star120 = deepStar
    export var star501 = function degree(ok) { return star(ok, 250) }
//    export var path50 = path_(50)
    export var path500 = function spiral(ok) { return path(ok, 50) }
//    export var path5000 = path_(5000)
    export var nT1 = nTree
    export var nT2 = nTreeAtFirst
}
