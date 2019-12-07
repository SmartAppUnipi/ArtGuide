import json
import time 
from document_adaptation import DocumentsAdaptation, User, semantic_search
import numpy as np
import matplotlib.pyplot as plt
from scipy import spatial
from config import config

# Lettura frasi
document_adaptation = DocumentsAdaptation(config, max_workers=4, verbose=1)

data = "adaptation/data/test.json"

with open(data, 'r', encoding="utf8") as f:
    json_query = json.load(f)

user = User(json_query["userProfile"])  # deve diventare binario su 6 elementi
results = document_adaptation.get_tailored_text(json_query['results'], user, config)  # formato giusto
print(results)
'''
def print_scatter(data, colors):

    x = data[:, 1]
    y = data[:, 2]
    if colors is None:
        plt.scatter(x, y, s=50)
    else:
        plt.scatter(x, y, s=50, c=colors)
    plt.title('Scatter plot for chosing sentences')
    plt.xlabel('Differences of topics w.r.t user')
    plt.ylabel('Difference of redeability w.r.t user')
    plt.show()


def policy(data):
    which = []
    for line in data:
        if (line[1]/2 + line[2]/2) < 0.05:
            which.append((0, 1, 0)) # verde = successo
        else:
            which.append((1, 0, 0)) # rosso = insuccesso
    return which


data = np.array(results)
user_level = user.expertise_level
user_level = 0.2  # per avere dati più realistici
user_tastes = [1, 1]
topics = data[:, 2]
scores = []
for line in topics:
    scores = np.append(scores, spatial.distance.cosine(line, user_tastes))


data[:, 2] = scores
levels = data[:, 1]
data[:, 1] = abs(data[:, 1]-user_level)
print_scatter(data, policy(data))
'''