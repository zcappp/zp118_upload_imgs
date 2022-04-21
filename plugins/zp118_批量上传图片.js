import React from "react"
import css from "../css/zp118_批量上传图片.css"

function render(ref) {
    const { exc, render, props, arr = [] } = ref
    const isUploading = arr.find(a => a.startsWith("blob"))
    return <React.Fragment>
        {arr.map((a, i) => <div className={"zp118B zp118_" + i + (a.startsWith("blob") ? " zp118U" : " zp118Z")} onClick={() => { if(!a.startsWith("blob")) { ref.zoom = a; render() }}} key={a + i}>
            <div/>
            <img src={a.startsWith("blob") || a.endsWith("svg") ? a : a + "?x-oss-process=image/resize,m_fill,h_300,w_300"}/>
            {!isUploading && <span onClick={e => remove(ref, i, e)}>{EL.del}</span>}
            {!isUploading && EL.handle}
        </div>)}
        {EL.网盘}
        <div className="zp118B">
            <div>{EL.camera}<label>{props.dbf ? props.label || "上传图片" : "请配置表单字段"}</label></div>
            <input onChange={e => onChange(ref, e)} type="file" accept="image/*" multiple="multiple"/>
        </div>
        {ref.zoom && <div onClick={() => {delete ref.zoom; render()}} className="zmask"><img src={ref.zoom}/>{EL.del}</div>}
        <div style={{display: "none"}}/>
    </React.Fragment>
}

function onInit(ref) {
    const { id, exc, props, render } = ref
    const arr = ref.getForm(props.dbf)
    if (Array.isArray(arr)) {
        ref.arr = [...arr]
    } else {
        if (arr) warn("表单字段必须是数组")
        ref.arr = []
    }
    if (props.gallery) {
        EL.网盘 = render({ t: "Plugin", p: { ID: "zp101", P: { mineOnly: true, onSelect: '$("#' + id + '").add(url)', type: "i", label: "图库" } } }, id + "_0")
        ref.container.add = url => {
            ref.arr.push(url)
            let arr = ref.getForm(props.dbf)
            if (!Array.isArray(arr)) arr = []
            arr.push(url)
            ref.setForm(props.dbf, arr)
        }
    }
    exc('load("//z.zccdn.cn/vendor/Sortable_1.13.0.js")', {}, () => {
        new Sortable(ref.container, {
            animation: 150,
            forceFallback: true,
            fallbackTolerance: 5,
            onSort: e => {
                let arr = ref.getForm(props.dbf)
                if (!Array.isArray(arr)) arr = []
                arr.splice(e.newDraggableIndex, 0, arr.splice(e.oldDraggableIndex, 1)[0])
                ref.setForm(props.dbf, arr)
                ref.arr = [...arr]
                render()
            },
            handle: "#" + id + " .zp118handler",
            draggable: ".zp118Z",
            dragClass: "zp118Drag",
            ghostClass: "zp118Drop"
        })
    })
}

function onChange(ref, e) {
    const { exc, render, props } = ref
    const arr = Array.from(e.target.files)
    if (!arr.length) return exc('warn("请选择图片")')
    arr.forEach((file, i) => setTimeout(() => {
        const x = URL.createObjectURL(file)
        ref.arr.push(x)
        render()
        exc('upload(file, option)', {
            file,
            option: {
                onProgress: r => {
                    $("#" + ref.id + " .zp118_" + ref.arr.indexOf(x) + " div").innerHTML = r.percent + "%"
                },
                onSuccess: r => {
                    let arr = ref.getForm(props.dbf)
                    if (!Array.isArray(arr)) arr = []
                    arr.push(r.url)
                    ref.setForm(props.dbf, arr)
                    preload(r.url, ref.container, () => {
                        ref.arr.splice(ref.arr.indexOf(x), 1, r.url)
                        URL.revokeObjectURL(x)
                        exc('render()')
                    })
                },
                onError: r => {
                    exc(`alert("上传出错了", r.error)`, { r })
                    ref.arr.splice(ref.arr.indexOf(x), 1)
                    URL.revokeObjectURL(x)
                }
            }
        })
    }, 2000 * i))
}

function remove(ref, i, e) {
    e.stopPropagation()
    ref.exc('confirm("确定要删除吗？")', {}, () => {
        let arr = ref.getForm(ref.props.dbf)
        arr.splice(i, 1)
        ref.arr = [...arr]
        ref.setForm(ref.props.dbf, arr)
    })
}

function preload(url, container, onload) {
    let el = document.createElement("img")
    el.src = url.endsWith("svg") ? url : url + "?x-oss-process=image/resize,m_fill,h_300,w_300"
    el.onload = onload
    container.lastElementChild.appendChild(el)
}

$plugin({
    id: "zp118",
    props: [{
        prop: "dbf",
        type: "text",
        label: "表单字段"
    }, {
        prop: "label",
        type: "text",
        label: "[上传图片]文本"
    }, {
        prop: "gallery",
        type: "switch",
        label: "包含图库"
    }],
    render,
    onInit,
    css
})

const EL = {
    camera: <svg className="zsvg zp118camera" viewBox="0 0 1024 1024"><path d="M384 128l-78.933333 85.333333L170.666667 213.333333c-46.933333 0-85.333333 38.4-85.333333 85.333333l0 512c0 46.933333 38.4 85.333333 85.333333 85.333333l682.666667 0c46.933333 0 85.333333-38.4 85.333333-85.333333L938.666667 298.666667c0-46.933333-38.4-85.333333-85.333333-85.333333l-134.4 0L640 128 384 128zM512 768c-117.333333 0-213.333333-96-213.333333-213.333333s96-213.333333 213.333333-213.333333 213.333333 96 213.333333 213.333333S629.333333 768 512 768zM512 554.666667m-136.533333 0a6.4 6.4 0 1 0 273.066667 0 6.4 6.4 0 1 0-273.066667 0Z"/></svg>,
    handle: <svg className="zsvg zp118handler" viewBox="0 0 1024 1024"><path d="M512 512M190.272 248.512l643.52 0 0 74.944-643.52 0 0-74.944ZM190.272 474.496l643.52 0 0 74.944-643.52 0 0-74.944ZM190.272 700.544l643.52 0 0 74.944-643.52 0 0-74.944Z"/></svg>,
    del: <svg className="zsvg zp118del" viewBox="64 64 896 896"><path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 0 0 203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"/></svg>
}


/*
zp118Z: zoom in/out
zp118B: block
zp118U: uploading

*/