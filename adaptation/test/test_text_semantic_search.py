import sys
# insert your path here. Sorry I didn't find a better solution :( 
sys.path.insert(0, "/home/mario/git/ArtGuide/adaptation/")
print(sys.path)
import document_adaptation.semantic_search
import time 
# sentences
test_text = "../data/mona_lisa.txt"
with open(test_text) as file:
  sentences = file.readlines()
sentences = [x for x in sentences if x != "\n"]
# keyword
keywords_list = ["history", "science", "biography", "fun fact", "art movement", "techniques"]
# models
BERT_distance = document_adaptation.semantic_search.BPE_Embedding_distance()
search_engine = document_adaptation.semantic_search.Semantic_Search(BERT_distance)
# result 
start = time.time()
search_engine.find_most_similar_one_keyword(sentences, keywords_list[0])
print("It took %.2f s\n\n" %(time.time() - start))

start = time.time()
search_engine.find_most_similar_multiple_keywords(sentences, keywords_list)
print("It took %.2f ms" %(time.time() - start))