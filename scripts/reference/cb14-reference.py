"""Esegue i termini di riferimento di CB14 estraendoli dal sorgente
OpenQuake, senza importare il pacchetto (che qui non si carica)."""
import re, sys, json
import numpy as np

SRC = '/Users/andrea/.cache/uv/archive-v0/hnEl0ZpXLLDJ5FUv/openquake/hazardlib/gsim/campbell_bozorgnia_2014.py'
src = open(SRC).read()

WANTED = ['_get_magnitude_term', '_get_geometric_attenuation_term',
          '_get_style_of_faulting_term', '_get_hypocentral_depth_term',
          '_get_fault_dip_term', '_get_anelastic_attenuation_term',
          '_get_shallow_site_response_term']
ns = {'np': np, 'CONSTS': {"h4": 1.0, "c": 1.88, "n": 1.18}}
for name in WANTED:
    m = re.search(r'^def ' + name + r'\(.*?(?=\n\ndef |\n\nclass )', src, re.S | re.M)
    if m is None:
        print('manca', name); sys.exit(1)
    exec(m.group(0), ns)

# la riga PGA della tabella, con l'intestazione delle colonne
head = re.search(r'^    IMT\s+(.*)$', src, re.M).group(1).split()
row = re.search(r'^    pga\s+(.*)$', src, re.M).group(1).split()
C = {k: float(v) for k, v in zip(head, row)}

class Ctx:
    pass

def mean_ln_pga(mag, rrup, vs30, hypo, rake, dip):
    ctx = Ctx()
    ctx.mag = np.array([mag]); ctx.rrup = np.array([rrup])
    ctx.vs30 = np.array([vs30]); ctx.hypo_depth = np.array([hypo])
    ctx.rake = np.array([rake]); ctx.dip = np.array([dip])
    base = (ns['_get_magnitude_term'](C, ctx.mag)
            + ns['_get_geometric_attenuation_term'](C, ctx.mag, ctx.rrup)
            + ns['_get_style_of_faulting_term'](C, ctx)
            + ns['_get_hypocentral_depth_term'](C, ctx)
            + ns['_get_fault_dip_term'](C, ctx)
            + ns['_get_anelastic_attenuation_term'](C, ctx.rrup))
    rock = np.exp(base + ns['_get_shallow_site_response_term'](False, C, np.array([1100.0]), np.array([0.0])))
    return float(np.exp(base + ns['_get_shallow_site_response_term'](False, C, ctx.vs30, rock))[0])

RAKE = {'reverse': 90.0, 'normal': -90.0, 'strike-slip': 0.0}
DIP = {'reverse': 45.0, 'normal': 55.0, 'strike-slip': 90.0}
out = []
for mag in [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0]:
    for rrup in [1, 5, 10, 20, 50, 100, 200]:
        for vs30 in [180, 360, 760, 1100]:
            for hypo in [5, 15, 30]:
                for style in ['reverse', 'normal', 'strike-slip']:
                    out.append({'mag': mag, 'rrup': rrup, 'vs30': vs30, 'hypo': hypo,
                                'style': style,
                                'pga': mean_ln_pga(mag, rrup, vs30, hypo, RAKE[style], DIP[style])})
print(json.dumps(out))
