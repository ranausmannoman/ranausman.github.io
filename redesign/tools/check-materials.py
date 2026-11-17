"""Check every named material, assigned reading pairs, and preview paint literals."""
import json
import re
from pathlib import Path
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]
PREVIEW = ROOT / "preview"

def luminance(colour):
    channels = [int(colour[i:i+2], 16) / 255 for i in (1, 3, 5)]
    return sum(factor * (c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4)
               for factor,c in zip((.2126,.7152,.0722),channels))

def compare(a,b):
    dark,light=sorted((luminance(a),luminance(b)))
    return (light+.05)/(dark+.05)

css=(PREVIEW/'tokens.css').read_text()
rules=re.findall(r':root(?:\[data-finish="dark"\])?\s*\{([^}]+)\}',css)
material={k:dict(re.findall(r'--([\w-]+):\s*(#[\da-fA-F]{6});',rule))
          for k,rule in zip(('light','dark'),rules)}
table={}
for finish,tokens in material.items():
    pairs={}
    def pair(fg,bg,minimum=None):
        score=compare(tokens[fg],tokens[bg])
        pairs[f'{fg} on {bg}']={'ratio':round(score,3),'minimum':minimum,
                                 'pass':None if minimum is None else score>=minimum}
    for fg in tokens:
        pair(fg,'surface')
    for bg in ('surface','surface-2','accent-soft'):
        for fg,minimum in [('ink',7),('ink-2',7),('ink-3',4.5),('accent',4.5),
                           ('accent-strong',4.5),('trace',3),('metal-3',3)]:
            pair(fg,bg,minimum)
    for fg,bg,floor in [('on-accent','accent',4.5),('on-accent','accent-strong',4.5),
                        ('component-mark','component',7),('led','component',4.5),
                        ('metal-3','component',3),('ink','metal-1',7),
                        ('ink-2','metal-1',4.5)]:
        pair(fg,bg,floor)
    table[finish]=pairs

# Hex, functional and named paint in declarations or SVG presentation attributes.
# HTML id, URL fragment and arbitrary class names (such as "silver") are not paint.
# CSS custom properties can refer back to the central material tokens.
hex_or_func=r'(?<![\w-])#(?:[\da-fA-F]{3,4}|[\da-fA-F]{6}|[\da-fA-F]{8})(?![\w-])|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\('
named=re.compile(r'(?:(?:fill|stroke|color|background(?:-color)?|border(?:-[\w-]+)?|outline(?:-color)?|box-shadow)\s*:\s*|(?:fill|stroke|stop-color)=["\'])(?:[\d.pxrem\s]+(?:solid\s+)?)?(black|white|silver|gray|grey|yellow|purple|red|blue|lime|green|transparent)(?=[;\s"\'}])',re.I)
findings=[]
for file in sorted(PREVIEW.iterdir()):
    if file.suffix not in ('.css','.html','.js','.svg'):
        continue
    source=file.read_text()
    if file.name=='tokens.css':
        source=re.sub(r':root(?:\[data-finish="dark"\])?\s*\{[^}]+\}','',source)
    for n,line in enumerate(source.splitlines(),1):
        source_line=re.sub(r'''(?:href=["']|url\()["']?#[\w-]+''','',line)
        for m in re.finditer(hex_or_func,source_line):
            findings.append([file.name,n,m.group()])
        for m in named.finditer(source_line):
            findings.append([file.name,n,m.group()])
report={'method':'WCAG relative luminance from sRGB. Null minimum denotes reference-only material.',
        'tokens':material,'ratios':table,'literalFindings':findings}
(ROOT/'evidence/materials.json').write_text(json.dumps(report,indent=2)+'\n')
failures=[(f,k,v) for f,t in table.items() for k,v in t.items() if v['pass'] is False]
print('Ratio rows:',{k:len(v) for k,v in table.items()},'Failures:',failures,'Literal hits:',findings)
if failures or findings:
    raise SystemExit(1)
