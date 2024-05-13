import React from "react"
import css from "./zp118_批量上传图片.css"

function render(ref) {
    const { exc, render, props, arr = [] } = ref
    const isUploading = arr.find(a => a.startsWith("blob"))
    return <React.Fragment>
        {arr.map((a, i) => <div className={"zp118B zp118_" + i + (a.startsWith("blob") ? " zp118U" : " zp118Z")} onClick={() => preview(ref, a)} key={a + i}>
            <div className="zp118progress"/>
            <img src={a.startsWith("blob") || a.endsWith("svg") ? a : a + "?x-oss-process=image/resize,m_fill,h_300,w_300"}/>
            {!isUploading && <i onClick={e => remove(ref, i, e)} className="zdel zp118del"/>}
            {!isUploading && EL.handle}
        </div>)}
        {EL.网盘}
        <div className="zp118B">
            <div>{EL.camera}<label>{props.dbf ? props.label || "上传图片" : "请配置表单字段"}</label></div>
            <input onChange={e => onChange(ref, e)} type="file" accept="image/*" multiple="multiple"/>
            {!!ref.props.url && <span onClick={() => popUrl(ref)}>URL</span>}
            {ref.modal}
        </div>
    </React.Fragment>
}

function init(ref) {
    const { getForm, id, exc, props, render } = ref
    if (!getForm) return exc('warn("请置于表单容器中")')
    const arr = getForm(props.dbf)
    if (Array.isArray(arr)) {
        ref.arr = [...arr]
    } else {
        if (arr) exc('warn("表单字段必须是数组")')
        ref.arr = []
    }
    if (props.gallery) {
        EL.网盘 = render({ t: "Plugin", p: { ID: "zp101", P: { mineOnly: true, onSelect: '$("#' + id + '").add(url)', type: "i", label: "图库" } } }, id + "_0")
        ref.container.add = url => {
            ref.arr.push(url)
            let arr = getForm(props.dbf)
            if (!Array.isArray(arr)) arr = []
            arr.push(url)
            ref.setForm(props.dbf, arr)
        }
    }
    exc('load("https://z.zccdn.cn/vendor/Sortable_1.13.0.js")', {}, () => {
        new Sortable(ref.container, {
            animation: 150,
            forceFallback: true,
            fallbackTolerance: 5,
            onSort: e => {
                let arr = getForm(props.dbf)
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
                    $("#" + ref.id + " .zp118_" + ref.arr.indexOf(x) + " .zp118progress").innerHTML = r.percent + "%"
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
        ref.exc('render()')
    })
}

function preload(url, container, onload) {
    let el = document.createElement("img")
    el.src = url.endsWith("svg") ? url : url + "?x-oss-process=image/resize,m_fill,h_300,w_300"
    el.onload = onload
    container.lastElementChild.appendChild(el)
}

function popUrl(ref) {
    ref.modal = <div className="zmodals">
        <div className="zmask" onClick={() => close(ref)}/>
        <div className="zmodal">
            <i onClick={() => close(ref)} className="zdel"/>
            <h3 className="hd">通过URL上传</h3>
            <div className="bd"><textarea rows="10" placeholder="把图片URL粘贴在这里，每行一条" className="zinput"/></div>
            <div className="ft">
                <div className="zbtn" onClick={() => close(ref)}>取消</div>
                <div className="zbtn main" onClick={() => upload(ref)}>上传</div>
            </div>
        </div>
    </div>
    ref.render()
    setTimeout(() => {
        $(".zp118B .zmodals").classList.add("open")
        $(".zp118B .zmodal textarea").focus()
    }, 99)
}

function preview(ref, img) {
    ref.modal = <div className="zmodals">
        <div className="zmask" onClick={() => close(ref)}/>
        <div className="zmodal">
            <i onClick={() => close(ref)} className="zdel"/>
            <h3 className="hd">{ref.props.dbf}</h3>
            <div className="zcenter" style={{minHeight:"200px"}}><img src={img}/></div>
        </div>
    </div>
    ref.render()
    setTimeout(() => $(".zp118B .zmodals").classList.add("open"), 99)
}

function close(ref) {
    ref.modal = ""
    ref.render()
}

function upload(ref) {
    const { exc } = ref
    let urls = $(".zp118 .zmodal textarea").value.split("\n").filter(a => !!a)
    if (!urls.length) return exc('alert("请输入图片URL")')
    exc('info("正在上传，请稍候")')
    close(ref)
    exc('$resource.uploads(urls, "i")', { urls }, r => {
        if (!r || r.ng.length) exc(`alert("上传出错了", reason)`, { reason: r ? JSON.stringify(r.ng, null, "\t") : "" })
        if (r.arr.length) {
            let arr = r.arr.map(a => a.url)
            ref.arr = [...ref.arr, ...arr]
            ref.setForm(ref.props.dbf, ref.arr)
            exc('render()')
        }
    })
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
    }, {
        prop: "url",
        type: "switch",
        label: "允许通过URL上传"
    }],
    render,
    init,
    css
})

const EL = {
    camera: <svg className="zsvg zp118camera" viewBox="0 0 1024 1024"><path d="M384 128l-78.933333 85.333333L170.666667 213.333333c-46.933333 0-85.333333 38.4-85.333333 85.333333l0 512c0 46.933333 38.4 85.333333 85.333333 85.333333l682.666667 0c46.933333 0 85.333333-38.4 85.333333-85.333333L938.666667 298.666667c0-46.933333-38.4-85.333333-85.333333-85.333333l-134.4 0L640 128 384 128zM512 768c-117.333333 0-213.333333-96-213.333333-213.333333s96-213.333333 213.333333-213.333333 213.333333 96 213.333333 213.333333S629.333333 768 512 768zM512 554.666667m-136.533333 0a6.4 6.4 0 1 0 273.066667 0 6.4 6.4 0 1 0-273.066667 0Z"/></svg>,
    handle: <svg className="zsvg zp118handler" viewBox="0 0 1024 1024"><path d="M256 160a96 96 0 1 0 0 192 96 96 0 0 0 0-192z m0 512a96 96 0 1 0 0 192 96 96 0 0 0 0-192zM672 256a96 96 0 1 1 192 0 96 96 0 0 1-192 0z m96 416a96 96 0 1 0 0 192 96 96 0 0 0 0-192z"/></svg>,
}


/*
zp118Z: zoom in/out
zp118B: block
zp118U: uploading

*/