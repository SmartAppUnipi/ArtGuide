import sys
sys.path.append('./')

from document_adaptation import DocumentsAdaptation, User
from config import config
from copy import deepcopy
from pprint import pprint
import json
import os


# Variabili da cambiare per i test
RESULT_DIR = '/tmp/'
INPUT_FILES = ['./data/ir_1575387713.4855616.json']

document_adaptation = DocumentsAdaptation(config, max_workers=4, verbose=config.debug)

print("Must be launched from root of adaptation's folder! \n\n")


def test_on_config(config, path):
    document_adaptation.update_config(config)
    
    with open(path) as file:
        req = json.load(file)

    req['tailoredText'] = ''    
    # Body
    user = User(req["userProfile"])
    
    document_adaptation.language_assertion(user.language)

    results = document_adaptation.get_tailored_text(req['results'], user, use_transitions=False)
    if not results:
        results = "Sorry,\nit is not art."
    return results

def main():
    params_expertise_weight = range(0, 11, 2)
    params_IR_score_weight = range(0, 11, 2)
    params_affinity_weight = range(0, 11, 2)

    results = []
    new_config = deepcopy(config)
    for file in INPUT_FILES:
        for i in params_expertise_weight:
                for j in params_IR_score_weight:
                    for k in params_affinity_weight:
                        new_config = config
                        new_config.expertise_weight = i
                        new_config.IR_score_weight = j
                        new_config.affinity_weight = k

                        text = test_on_config(config, file)
                        results.append({'expertise':i, 'ir':j, 'affinity':k, 'text':text})
        unique_texts = list(set([r['text'] for r in results])) 
        aggregate_results = []
        for u in unique_texts:
            params = []
            for r in results:
                if u==r['text']:
                    params.append({'expertise':r['expertise'], 'ir':r['ir'], 'affinity':r['affinity']})
            aggregate_results.append({'text':u, 'params':params})

        # To plain text
        plain_text = [file]
        plain_text += ['  ']

        for i in aggregate_results:
            plain_text += ['#'*50]
            plain_text += [i['text']]
            plain_text += [i['text']]
            for index, j in enumerate(i['params']):
                plain_text += ['-'*50]
                plain_text += ['{} - expertise={}, ir={}, affinity={}'.format(index, j['expertise'], j['ir'], j['affinity'])]
            plain_text += ['-'*50]
        out_path = os.path.join(RESULT_DIR, os.path.basename(file)+'.txt')
        print('Output ready for {}'.format(out_path))
        with open(out_path, 'wt') as out:
            pprint(plain_text, stream=out)

main()



