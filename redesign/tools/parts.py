"""Original top-down footprints. Coordinates are local drawing units, not CSS pixels."""
from html import escape
from math import cos, sin, pi

def rect(x, y, w, h, material, r=0):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" class="{material}"/>'

def circle(x, y, r, material):
    return f'<circle cx="{x}" cy="{y}" r="{r}" class="{material}"/>'

def path(d, material):
    return f'<path d="{d}" class="{material}"/>'

def mark(x, y, label, size=4, material="etch"):
    return f'<text x="{x}" y="{y}" font-size="{size}" class="{material}">{escape(label)}</text>'

def use(part, x=0, y=0, scale=1, angle=0):
    return f'<use href="#p-{part}" transform="translate({x} {y}) rotate({angle}) scale({scale})"/>'

def group(name, *shapes):
    return f'<g id="p-{name}">' + ''.join(shapes) + '</g>'

def seq(shape, n):
    return ''.join(shape(i) for i in range(n))

def holes(w, h, offset):
    return ''.join(use("screw", x, y) for x in (offset, w-offset) for y in (offset, h-offset))

def fundamentals():
    return ''.join([
        group("via", circle(0,0,1.6,"pad"),circle(0,0,.72,"well")),
        group("smd", rect(0,0,7,3,"silver"),rect(1.6,-.2,3.8,3.4,"black")),
        group("resistors", seq(lambda i: use("smd",0,i*5),5)),
        group("screw",circle(0,0,3.5,"machined"),circle(0,0,2.5,"silver"),
              path("M-1.8 1.6 1.8 -1.6","engrave")),
        group("mount",circle(0,0,8.5,"silk-ring"),circle(0,0,6.9,"ring-metal"),
              circle(0,0,4,"mask-edge"),
              seq(lambda i:circle(round(7*cos(i*pi/4),2),round(7*sin(i*pi/4),2),.58,"pad"),8)),
        group("cap",circle(0,0,6.5,"black-edge"),circle(0,-.7,5.7,"machined"),
              path("M-3 -4Q-5 -1 -3 3M0 -4V0L3 2M0 0 -2 2","engrave")),
        group("fiducial",circle(0,0,3.7,"silk-ring"),circle(0,0,1.8,"pad")),
        group("crystal",rect(0,0,23,8,"black-edge",4),rect(1,0,20,6,"machined",3),
              path("M4 2 H17","engrave")),
        group("qfp", rect(0,0,31,26,"contacts"),rect(2,2,27,22,"black-edge",1.5),
              seq(lambda i:rect(5+i*4,0,1.3,26,"silver"),6),rect(3,3,25,20,"black-edge",1),
              circle(6,6,1.1,"silver"),mark(8,17,"RU-X1",3,"chip-etch")),
        group("phase", rect(1,4,47,45,"silk-ring",2),use("cap",8,15),use("cap",8,32),
              rect(18,10,22,25,"machined",3),rect(20,12,18,20,"silver",2),
              path("M22 28V15H36","engrave"),mark(23,25,"VRM",4),
              rect(19,39,11,6,"black-edge",1),rect(32,39,8,6,"black-edge",1),
              use("smd",41,9,.7,90),use("smd",41,22,.7,90)),
        group("vrm",seq(lambda i:use("phase",i*51,0),3)),
        group("fan",rect(0,0,47,22,"black-edge",2),path("M3 16V6H44V16","metal-wire"),
              seq(lambda i:rect(7+i*10,10,4,5,"machined"),4),rect(4,18,39,3,"silver"),
              rect(54,3,40,16,"black-edge",1),
              seq(lambda i:rect(59+i*6,7,3,8,"lit" if i<3 else "mid"),5)),
        group("tpm",rect(1,2,75,37,"contacts"),rect(3,4,71,33,"black-edge",2),
              seq(lambda i:rect(7+i*8,0,3,7,"silver")+rect(7+i*8,34,3,7,"silver"),8),
              seq(lambda i:rect(8+i*21,10,17,19,"relief",1)+circle(12+i*21,14,1.5,"lit"),3),
              mark(13,23,"1",4,"chip-etch"),mark(34,23,"2",4,"chip-etch"),mark(55,23,"3",4,"chip-etch")),
        group("bios",rect(0,10,47,30,"contacts"),seq(lambda i:rect(3+i*6,6,3,38,"silver"),7),
              rect(1,11,45,28,"black-edge",2),circle(6,16,1.5,"silver"),mark(12,29,"BIOS",7,"chip-etch")),
        group("cmos",circle(0,0,22,"black-edge"),circle(-1,-1,19.5,"machined"),
              circle(-1,-1,16.6,"silk-ring"),path("M-6 -2H4M-1 -7V3","engrave"),
              path("M12 -18H20V-9H16Z M-22 6H-14V13H-21Z","silver")),
        group("history",use("cmos",21,25),use("bios",52,1)),
        group("sata",rect(0,0,39,40,"black-edge",2),rect(3,4,33,22,"relief",1),
              path("M7 20V10H31V15H26","metal-wire"),
              seq(lambda i:rect(9+3*i,12,1.4,5,"pad"),6),
              rect(3,29,33,6,"mid",1), path("M6 32H32","engrave")),
        group("storage",use("sata"),use("sata",43,0)),
        group("power",rect(1,1,37,100,"black-edge",2),rect(-2,33,5,35,"mid"),
              ''.join(rect(4+x*16,4+y*8,13,6,"relief",1)+rect(8+x*16,6+y*8,5,2,"silver")
                      for x in range(2) for y in range(12)),
              circle(66,37,15,"machined"),circle(66,37,12,"black-edge"),
              path("M66 29V36M62 31A7 7 0 1 0 70 31","lit-line")),
        group("switch",rect(0,0,36,12,"black-edge",2),rect(3,3,30,6,"relief",1),
              '<g class="slider-art">'+rect(3,2,14,8,"machined",1)+path("M7 3V9M10 3V9M13 3V9","engrave")+'</g>'),
        group("debug",rect(0,0,55,32,"black-edge",2),rect(3,3,49,26,"relief",1),
              mark(7,25,"08",25,"chip-etch"),circle(49,25,1.4,"lit")),
    ])

def cpu():
    plate = "M28 18H150L165 33V107L154 121H34L20 107V32Z"
    return group("cpu",
        rect(0,0,186,139,"mask-edge",4),rect(3,3,180,133,"contacts",3),
        rect(8,7,167,125,"pinfield",3),
        path("M15 10H160L175 25V112L163 127H17L11 119V22Z","machined"),
        path(plate,"black-edge"),path("M35 23H148L160 35V103L150 116H36L25 103V36Z","lid"),
        path("M29 51V38L38 29M150 99V104L143 111","engrave"),
        rect(61,6,64,5,"black-edge",2),rect(64,6,58,3,"silver",1),
        path("M179 21V105L184 111V125L178 130H153","lever"),
        path("M179 21V105L184 111V125L178 130H153","lever-light"),
        holes(178,133,7),path("M20 19H27L20 26Z","pad"))

def memory():
    stick = group("stick",rect(1,6,13,138,"black-edge",1),rect(4,1,7,151,"contacts"),
                  rect(5,7,5,135,"relief"),seq(lambda i:rect(3,12+i*18,9,14,"black-edge",.8),7),
                  path("M0 0H15L13 9H2ZM2 143H13L15 152H0Z","machined"),
                  seq(lambda i:path(f"M12 {12+i*5}h2.5","engrave"),25))
    return stick+group("dimm",seq(lambda i:use("stick",i*19),4))

def heatsink():
    base = "M0 13L13 0H104L118 14V83L106 95H14L0 81Z"
    fins = ''.join(path(f"M{x} 6h6L{x-9} 35h-6Z","machined") for x in range(24,100,10))
    fins += ''.join(path(f"M{x} 60h6L{x-8} 88h-6Z","machined") for x in range(28,103,10))
    return group("pch",path(base,"black-edge"),fins,rect(5,39,108,17,"relief",1),
                 path("M9 52L22 42H30L17 52Z M21 52 34 42H38L26 52Z","pad"),
                 mark(68,51,"RU-X1",9,"chip-etch"),use("screw",10,12),use("screw",107,83))

def storage_cards():
    module = group("module",path("M0 1H106L113 8V14L106 21H0Z","mask-edge"),
                   rect(-2,2,4,17,"contacts"),rect(7,4,23,14,"black-edge",1),
                   rect(36,5,28,12,"black-edge",1),use("smd",73,4),use("smd",73,13),
                   circle(105,11,3.5,"ring-metal"),circle(105,11,1.8,"well"))
    # Each card has a repeatable component layout. The diagonal set is Maker’s Row.
    arrangements = [
        rect(9,4,36,12,"black-edge",1)+path("M14 12h5l3 -5 4 7 3 -4h9","lit-line"),
        rect(9,4,36,12,"black-edge",1)+use("makers-mark",12,6),
        rect(10,4,13,12,"black-edge",1)+rect(27,4,13,12,"black-edge",1),
        seq(lambda i:rect(9+9*i,5,6,10,"black-edge",1),4),
        rect(8,4,37,12,"machined",1)+seq(lambda i:path(f'M{13+i*5} 6v8',"engrave"),6),
        rect(9,7,22,7,"black-edge",1)+use("smd",35,8),
    ]
    cards = group("makers-mark",seq(lambda i:path(f'M{4+i*8} 0h5l-4 8h-5Z',"lit"),3))
    for i,layout in enumerate(arrangements):
        cards += group(f"expansion-{i}",
                 path("M4 2H188L195 8V19H118V23H98V19H4Z","accent-mask"),
                 rect(1,0,4,23,"machined",1), layout,
                 rect(54,5,17,11,"black-edge",1),rect(76,5,17,11,"black-edge",1),
                 rect(98,6,42,8,"paper"),rect(100,7,22,5,"barcode"),
                 use("smd",151,6),use("smd",162,6),rect(12,18,78,3,"contacts"),
                 rect(95,18,44,3,"contacts"),circle(187,12,1.6,"pad"))
    slot = group("slot",rect(0,0,236,10,"black-edge",1),rect(5,3,220,4,"contacts"),
                 rect(40,1,4,8,"silver"),path("M227 -2H240V5L235 10H227Z","machined"))
    # Five case studies plus the shorter additional-work card. All slots share a key and retention clip.
    rack = group("pcie",seq(lambda i:use("slot",0,10+i*15,.99 if i==0 else .86)+
                use(f"expansion-{i}",4,2+i*15,.99 if i==0 else (.61 if i==5 else .77)),6))
    return module+group("m2",seq(lambda i:use("module",0,i*23),3))+cards+slot+rack

def rear_io():
    body = [path("M0 3H51L57 10V143L51 150H0Z","machined"),
            path("M3 8V143M47 6V146","engrave")]
    for y in (13,40):
        body.extend([rect(3,y,41,20,"black-edge",1),rect(6,y+3,35,14,"silver",1),
                     rect(7,y+5,32,9,"black-edge"),rect(9,y+9,28,2,"pad")])
    body.extend([rect(3,69,44,37,"machined"),path("M8 74H41V91H34V99H16V91H8Z","black-edge"),
                 seq(lambda i:rect(11+i*4,76,1.5,8,"pad"),7)])
    for x in (12,32):
        body.extend([circle(x,126,8,"black-edge"),circle(x,126,5.6,"machined"),circle(x,126,3.7,"well")])
    return group("io",*body)

def library():
    gradients = '''
    <linearGradient id="steel" x2=".8" y2="1" gradientUnits="objectBoundingBox">
      <stop class="metal-light"/><stop offset=".43" class="metal-light"/><stop offset=".46" class="metal-mid"/><stop offset="1" class="metal-light"/></linearGradient>
    <linearGradient id="lid" x2="1" y2=".8"><stop class="mask-stop"/><stop offset=".65" class="metal-light"/><stop offset="1" class="mask-stop"/></linearGradient>
    <pattern id="fingers" width="3" height="6" patternUnits="userSpaceOnUse"><rect width="2" height="6" class="pad"/></pattern>
    <pattern id="pins" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" class="black"/><circle cx="1.5" cy="1.5" r=".65" class="silver"/></pattern>
    <pattern id="bars" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 0V12 M2 0V12 M6 0V12 M10 0V12" class="bar-line"/><path d="M4 0V12 M8 0V12" class="bar-heavy"/></pattern>
    <pattern id="mask-weave" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".62" class="mesh-dot"/></pattern>
    '''
    return '<svg class="library" width="0" height="0" aria-hidden="true" focusable="false"><defs>'+gradients+fundamentals()+cpu()+memory()+heatsink()+storage_cards()+rear_io()+'</defs></svg>'
