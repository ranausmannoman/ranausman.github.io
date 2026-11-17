"""Paired board placements and shared HTML navigation for the RU-X1."""
from html import escape
from parts import rect, circle, path, mark, use, seq

WIDTH, HEIGHT = 810, 568
# Navigation follows the existing chapter order. x/y/w/h cover the part AND label.
# part x/y/scale inside the wide mask, then bounding box and label anchor.
PARTS = [
    ("cpu","U1","Rana Usman","#top", (245,165,1.17),(244,165,218,166),(0,0),(186,139)),
    ("pcie","PCIE","Selected work","#work",(44,414,1.12),(40,414,268,136),(46,521),(241,100)),
    ("pch","PCH","Engineering","../../index.html#services",(346,368,1.04),(341,367,140,138),(342,477),(119,97)),
    ("history","BIOS / CMOS","Experience","../../index.html#experience",(119,206,.99),(104,199,130,94),(112,258),(103,52)),
    ("m2","M2","SI & workflows","../../index.html#si-workflows",(55,305,1.05),(47,302,151,103),(51,378),(116,69)),
    ("vrm","VRM1–3","My process","#approach",(164,71,1.05),(159,69,163,90),(165,128),(153,50)),
    ("tpm","TPM","Cybersecurity","../../index.html#cybersecurity",(525,386,1.09),(512,381,119,92),(516,437),(78,42)),
    ("storage","SATA","Reading","../../index.html#reading",(681,382,1),(668,379,99,90),(674,430),(83,41)),
    ("fan","FAN","Fitness","../../index.html#fitness",(652,289,1.04),(643,281,116,69),(649,317),(95,24)),
    ("io","IO","Contact","../../index.html#contact",(6,71,1.11),(5,70,85,208),(16,244),(58,152)),
    ("dimm","DIMM","Built across the stack","#stack",(502,84,1.16),(485,82,142,219),(491,268),(73,154)),
    ("power","PWR","Discuss a project","mailto:ranausmannoman@gmail.com?subject=Project%20enquiry",
     (673,82,1),(650,80,136,151),(653,193),(85,102))
]

def svg(content, box, css=""):
    return f'<svg aria-hidden="true" focusable="false" class="{css}" viewBox="{box}">{content}</svg>'

def bundle(points, count, dx, dy, key, power=False):
    # Parallel tracks preserve 45-degree corners, including small matched detours.
    d = 'M'+' '.join(f'{x} {y}' for x,y in points)
    wires = ''.join(f'<path transform="translate({i*dx} {i*dy})" d="{d}"/>' for i in range(count))
    return (f'<g class="bus bus-{key}{" feed" if power else ""}" data-route="{key}">{wires}'
            f'<path class="pulse" d="{d}" pathLength="100"/></g>')

def wide_copper():
    routes = [
        ("io",[(57,170),(94,170),(113,189),(199,189),(226,216),(274,216)],5,0,3),
        ("history",[(207,226),(233,226),(260,253),(287,253)],4,0,3),
        ("vrm",[(264,115),(285,136),(312,136),(335,159),(335,186)],4,7,0),
        ("power",[(688,117),(680,109),(680,65),(671,56),(411,56),(374,93),(374,172)],3,0,5),
        ("dimm",[(507,136),(494,149),(494,168),(482,180),(482,192),(475,199),(468,192),(468,185),(461,178),(454,185),(454,214),(433,235)],7,0,4),
        ("m2",[(161,336),(205,336),(239,302),(263,302),(280,285)],5,0,4),
        ("pcie",[(152,422),(152,401),(179,374),(228,374),(264,338),(282,338),(301,319)],8,4,0),
        ("pch",[(399,390),(399,362),(377,340),(377,313)],6,4,0),
        ("tpm",[(559,398),(559,375),(527,343),(484,343),(451,310),(428,310)],5,4,0),
        ("storage",[(691,396),(671,376),(657,376),(612,331),(527,331),(492,296),(451,296)],6,0,4),
        ("fan",[(680,300),(650,270),(650,246),(610,206),(572,206),(540,238),(452,238)],3,0,4),
        ("debug",[(693,512),(664,483),(567,483),(548,464),(510,464),(490,444),(463,444),(405,386),(405,320)],3,0,3),
        ("switch",[(442,31),(419,54),(378,54),(357,75),(357,182)],2,4,0),
    ]
    return ''.join(bundle(points,n,dx,dy,key,key in ("power","vrm")) for key,points,n,dx,dy in routes)

def furniture():
    out = []
    # Passives cluster at the pins they decouple. Keep the silk legends clear.
    for x,y,angle,n in [(120,83,0,3),(92,310,90,2),(216,305,90,2),(447,76,0,3),
                         (472,352,90,2),(601,165,0,2),(620,402,90,2),(300,466,0,2),
                         (48,80,0,1),(444,527,90,3),(354,521,90,3),(164,164,90,3),
                         (621,96,0,2),(738,239,90,2),(604,483,90,3)]:
        out.extend(use("resistors",x+i*11,y,.85,angle) for i in range(n))
    for x,y in [(92,137),(93,158),(99,88),(311,353),(325,353),(339,353),
                (505,71),(525,71),(545,71),(565,71),(778,374),(778,390)]:
        out.append(use("cap",x,y,.88))
    for x,y in [(107,117),(204,157),(207,385),(310,445),(619,205),(740,344),(521,508)]:
        out.append(use("qfp",x,y,.86))
    for x,y in [(97,185),(280,393),(467,111),(600,254),(345,539),(649,359),(722,535)]:
        for i in range(8):
            out.append(use("via",x+i%4*4.4,y+i//4*4.4,.85))
    for x,y in [(33,294),(133,387),(445,122),(600,61),(780,327),(644,487),(315,535)]:
        out.append(use("fiducial",x,y,.75))
    out.extend((use("crystal",151,182),use("crystal",586,511),
                use("switch",430,25),mark(399,34,"SW1",6),
                rect(599,23,100,23,"paper",1),rect(605,26,62,12,"barcode"),
                mark(669,35,"RU-X1",6),mark(606,44,"REV 2026",4)))
    for x,y,s in [(120,80,"VRM"),(594,157,"DIMM"),(196,382,"M2"),(630,352,"FAN"),
                  (520,378,"TPM"),(743,371,"SATA"),(354,535,"RU-X1"),(278,478,"PCIE"),
                  (113,152,"IO"),(534,539,"ranausman.dev")]:
        out.append(mark(x,y,s,5))
    # Local stitching grounds, thermal vias and short component-to-component fanouts.
    for x,y,w,h in [(109,95,42,23),(167,170,47,16),(288,366,36,21),(580,215,37,25),
                      (584,107,45,26),(468,477,37,29),(726,261,39,18),(568,491,43,15),
                      (199,456,76,22),(321,518,46,15),(714,345,42,18),(227,84,28,15)]:
        shapes = [path(f'M0 {j*3}h{w//3}l{h//2} {h//2}h{w//5}', 'local-trace')
                  + use('via',w//3+h//2+w//5,j*3+h//2,.75) for j in range(3)]
        shapes += [use('smd',4,12,.72),use('smd',12,12,.72)]
        out.append(f'<g transform="translate({x} {y})">'+''.join(shapes)+'</g>')
    return '<g class="furniture">'+''.join(out)+'</g>'

def wide_art():
    shape="M23 3H608L617 12H780L805 37V531L774 563H480L472 555H45L23 533H5V54L15 44V12Z"
    face=path(shape,"board-edge")+path(shape,"texture")
    face+=path("M23 45V20H41M783 46V37L768 22M23 511V522L42 541M757 549H767L788 528", "engrave")
    face+=wide_copper()+furniture()+''.join(use(part,*geom) for part,_,_,_,geom,*_ in PARTS)
    face+=''.join(use("mount",x,y) for x,y in [(30,28),(781,42),(26,522),(771,533),(479,46)])
    face+=rect(686,498,53,31,"black-edge",3)+mark(659,517,"DBG",8)
    face+=mark(48,554,"PCIE",4)+mark(571,550,"REV 2026",4)
    return svg(face,"0 0 810 568","wide-art")

def mobile_furniture(i):
    # Trunks and angled drops are drawn at a constant size while rows accommodate type.
    art = ''.join(path(f'M{3+3*k} 0V19L{11+3*k} 27V48L{3+3*k} 56V100','row-trace') for k in range(3))
    art += ''.join(path(f'M{11+3*k} {35+3*k}h9l12 12h26','row-trace') for k in range(3))
    art += use('via',34,59,.85) + use('smd',47,70,.8) + use('smd',47,75,.8)
    return svg(art,'0 0 62 100','row-copper').replace('viewBox=', 'preserveAspectRatio="none" viewBox=')

def nav_links():
    items=[]
    for i,(part,ref,label,url,geom,bb,caption,view) in enumerate(PARTS):
        small = svg(use(part,2,2),f'-2 -2 {view[0]+6} {view[1]+6}',"portrait-part")
        if part=="cpu":
            small = small.replace('viewBox=', 'preserveAspectRatio="none" viewBox=')
            inside = '<span class="cpu-face"><span class="cpu-name"><small aria-hidden="true" id="ref-cpu">U1</small><b>Rana Usman.</b></span><span aria-hidden="true" id="cpu-role">Senior Full-Stack Engineer / Technical Lead</span><span aria-hidden="true" id="cpu-place">Lahore, Pakistan</span></span>'
        else:
            inside = f'<span class="component-label"><small id="ref-{part}" aria-hidden="true">{ref}</small><b>{escape(label)}</b></span>'
        description = "ref-cpu cpu-role cpu-place" if part == "cpu" else f"ref-{part}"
        items.append(f'<li class="station st-{part}"><a data-part="{part}" aria-describedby="{description}" href="{url}">{mobile_furniture(i)}{small}{inside}</a></li>')
    return ''.join(items)

def placement_css():
    sheet=['/* Generated from the footprint placement table. */']
    for part,ref,label,url,geom,(x,y,w,h),(cx,cy),view in PARTS:
        css = f'.st-{part}'
        sheet.append(f'{css} {{left:{100*x/WIDTH:.4f}%;top:{100*y/HEIGHT:.4f}%;width:{100*w/WIDTH:.4f}%;height:{100*h/HEIGHT:.4f}%;}}')
        if part!="cpu":
            sheet.append(f'{css} .component-label {{left:{100*(cx-x)/w:.3f}%;top:{100*(cy-y)/h:.3f}%;}}')
    return '\n'.join(sheet)+'\n'

def pcb():
    return f'''<nav class="board" aria-label="Portfolio chapters">
        {wide_art()}
        <div class="board-id"><strong>RU-X1</strong><span>REV 2026</span></div>
        <div class="portrait-silk" aria-hidden="true">{svg(use("switch",1,3)+rect(46,3,42,12,"barcode"),"0 0 90 18","")}</div>
        <ol class="stations">{nav_links()}</ol>
        <div class="board-stat"><strong>6+</strong> Years building business systems</div>
        <span class="board-domain">ranausman.dev</span>
        <span class="map-debug" aria-hidden="true" data-debug>01</span>
      </nav>'''
