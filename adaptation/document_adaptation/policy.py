from sklearn.metrics.pairwise import cosine_similarity
from user import User
from documents_adaptation import DocumentsAdaptation
import json
from bpemb import BPEmb


class Policy:
    def __init__(self, sentences, keywords, user):
        self.sentences = sentences
        self.keywords = keywords
        self.clusters = {}
        self.user = user
        self.user_taste_embedded = []

    def create_clusters(self):
        for key in self.keywords:
            for sentence in self.sentences:
                if key in sentence.keyword:
                    if key in self.clusters:
                        self.clusters[key].append(sentence)
                    else:
                        self.clusters[key] = [sentence]

    def apply_policy(self):
        output = {}
        for cluster in self.clusters:
            output[cluster] = []
            for sentence in self.clusters[cluster]:
                output[cluster].append((self.policy(sentence), sentence.sentence))
        self.sentences = output

    def policy(self, x):
        r = 1 / 2
        s = 1 / 2
        return (abs(x.readibility-user.expertise_level) * r) + (self.calculate_similiarity(x, self.user) * s)

    def calculate_similiarity(self, sentence, user):#salient sentence e user
        sent = sentence.sentence_embeddings
        sum = sent[0]
        for cur in sent:
            sum = sum + cur
        res = cosine_similarity(sum.reshape(1, -1), self.user_taste_embedded.reshape(1, -1))
        return res

    def auto(self):
        self.create_clusters()
        self.embed_user_tastes()
        self.apply_policy()

    def embed(self, array):
        embedder = BPEmb(lang=user.language, dim=200, vs=200000)
        embedded_keywords = []
        for key in array:
            embedded_keywords.append(embedder.embed(key))
        return embedded_keywords

    def embed_user_tastes(self):
        aux = self.embed(self.user.tastes)
        tastes = aux[0]
        for cur in aux[1:]:
            tastes = tastes + cur
        self.user_taste_embedded = tastes


if __name__ == "__main__":

    #Lettura risultati
    document_adaptation = DocumentsAdaptation(max_workers=4, verbose=0)
    data = r"../data/test.json"
    with open(data, 'r', encoding="utf8") as f:
        json_query = json.load(f)

    #Preparazione variabili
    user = User(json_query["userProfile"])
    results = document_adaptation.get_tailored_text(json_query['results'], user)
    keywords = ["science", "biography", "history", "fun facts", "art movements", "techniques"]

    print(results)
    #Togliere duplicati da result
    for a in results:
        for b in results:
            if a.sentence == b.sentence:
                if a != b:
                    results.remove(b)

    #Filtro alcune frasi con leggi fisse
    for a in results:
        if len(a.sentence) < 100:
            results.remove(a)
        elif len(a.sentence) > 1000:
            results.remove(a)
        elif '^' in a.sentence:
            results.remove(a)


    #Utilizzo della classe policy
    policy = Policy(results, keywords, user)
    policy.create_clusters()
    policy.embed_user_tastes()
    policy.apply_policy()

    #Mostra i risultati
    for cluster in policy.sentences:
        policy.sentences[cluster] = sorted(policy.sentences[cluster], key=lambda tup: tup[0])
    for cluster in policy.sentences:
        print("Results for "+cluster+" (the lower the number, the better the sentence):")
        for sentence in policy.sentences[cluster][:30]:
            print(str(sentence[0])+": "+sentence[1])
