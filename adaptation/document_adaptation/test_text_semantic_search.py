import sys
import json
import time 
import semantic_search
from user import User
from documents_adaptation import DocumentsAdaptation
document_adaptation = DocumentsAdaptation(max_workers=4, verbose=0)
# sentences
test_text = "adaptation/data/mona_lisa.txt"
with open(test_text) as file:
  sentences = file.readlines()
sentences = [x for x in sentences if x != "\n"]
# keyword
keywords_list = ["history", "science", "biography", "fun fact", "art movement", "techniques"]
# models
BERT_distance = semantic_search.BPEmb_Embedding_distance()
search_engine = semantic_search.Semantic_Search(BERT_distance)
# result 
start = time.time()
search_engine.find_most_similar_one_keyword(sentences, keywords_list[0])
print("It took %.2f s\n\n" %(time.time() - start))

start = time.time()
search_engine.find_most_similar_multiple_keywords(sentences, keywords_list)
print("It took %.2f ms" %(time.time() - start))

data = "adaptation/data/input_phase2_a.json"

with open(data, 'r') as f:
    json_query = json.load(f)

user = User(json_query["userProfile"])
results = document_adaptation.get_tailored_text(json_query['results'], user)