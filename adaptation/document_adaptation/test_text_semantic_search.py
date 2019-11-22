import json
import time 
import semantic_search
from user import User
from documents_adaptation import DocumentsAdaptation
import numpy as np
import matplotlib.pyplot as plt
from scipy import spatial

# Lettura frasi
document_adaptation = DocumentsAdaptation(max_workers=4, verbose=0)
test_text = "adaptation/data/mona_lisa.txt"
with open(test_text, encoding="utf8") as file:
    sentences = file.readlines()
sentences = [x for x in sentences if x != "\n"]

# Keyword
keywords_list = ["history", "science", "biography", "fun fact", "art movement", "techniques"]

# Models
# BERT for distance
BERT_distance = semantic_search.BERT_distance()
# BPEmb embedding for distance
BPEmb_distance = semantic_search.BPEmb_Embedding_distance()
search_engine = semantic_search.Semantic_Search(BPEmb_distance)

# Result
start = time.time()
search_engine.find_most_similar_one_keyword(sentences, keywords_list[0])
print("It took %.2f s\n\n" %(time.time() - start))

start = time.time()
search_engine.find_most_similar_multiple_keywords(sentences, keywords_list)
print("It took %.2f ms" %(time.time() - start))

data = "adaptation/data/input_phase2_a.json"

with open(data, 'r', encoding="utf8") as f:
    json_query = json.load(f)

user = User(json_query["userProfile"])  # deve diventare binario su 6 elementi
results = document_adaptation.get_tailored_text(json_query['results'], user)  # formato giusto


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
