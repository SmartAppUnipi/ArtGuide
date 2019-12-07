from sklearn.metrics.pairwise import cosine_similarity
import json
import numpy as np

'''
Usage: chiamate auto() e print_results(n) per stampare i primi n risultati per ogni chiave
Inizialmente la classe Policy elimina i duplicati da sentences (lista di SalientSentence) e toglie alcune frasi
seguendo delle regole fisse (che trovate nella funzione heuristic_filter). Dopoddichè la classe policy crea un 
dizionario dove la chiave è la keyword con la quale ho trovato i documenti che contenevano quelle frasi. Poi per ogni
elemento viene calcolato quanto quello assimiglia ai gusti generali dell'utente e ogni lista viene ordinata. Con print
results possiamo scegliere quanti elementi vogliamo visualizzare.
Migliorie: così creo cluster basandomi su tutte le keyword, ma noi vogliamo solo quelle dell'utente
'''


class Policy:
    def __init__(self, sentences, user):
        self.sentences = sentences
        self.user = user
        self.user_taste_embedded = user.tastes_embedded
        self.user_taste_embedded_summed = []
        self.tastes = list(self.user_taste_embedded.keys())
        self.clusters = {}
        self.results = {}

    def eliminate_duplicates(self):
        for a in self.sentences:
            for b in self.sentences:
                if a.sentence == b.sentence:
                    if a != b:
                        self.sentences.remove(b)

    def heuristic_filter(self):
        for a in self.sentences:
            if len(a.sentence) < 100:
                self.sentences.remove(a)
                continue
            if len(a.sentence) > 1000:
                self.sentences.remove(a)
                continue
            if '^' or '>' or '<' in a.sentence:
                self.sentences.remove(a)

    def create_cluster_greedy(self):
        '''
        Algorithm that creates the cluster for each sentences. 
        Given the user tastes and the salient sentences it returns a list ok K(K selected as parameter)
        best sentences for each user taste.
        This implementation is made with an euristic greedy algorithm.
        We create a list of sentences for each taste and then, starting from the taste with less number of sentence
        we sort and fix the best K results.
        Then we do the same for each taste.
        '''
        if not self.user.tastes:
            return self.sentences[10]
        tastes = {t:[] for t in self.user.tastes}
        for s in self.sentences:
            for k in s.keyword:
                tastes[k] += s
        for t in tastes:
            t.sort(key = lambda x: x.score ,reverse = True)
        tastes.sort( key =lambda x: len(x) )
        result = {t:[] for t in self.user.tastes}
        for t in tastes:
            for s in tastes[t]:
                if not s.assigned:
                    result[t].append(s)
                    s.assigned = True
        return result





    def create_cluster_ILP(self):
        '''
        Algorithm that creates the cluster for each sentences. 
        Given the user tastes and the salient sentences it returns a list ok K(K selected as parameter)
        best sentences for each user taste.
        We translate this problem to an integer graph optimization prbolem. 
        The idea is to use integer linear programming for the task.
        '''
        pass

    def create_clusters(self):
        for taste in self.tastes:
            self.clusters[taste] = []
        for sentence in self.sentences:
            max = 0
            best = ""
            for taste in self.tastes:
                x = np.array(self.user_taste_embedded[taste][0]).reshape(1, -1)
                y = np.array(sentence.sentence_embeddings_summed).reshape(1, -1)
                score = cosine_similarity(x, y)[0]
                if score > max:
                    max = score
                    best = taste
            self.clusters[best].append(sentence)

    def apply_policy(self):
        for cluster in self.clusters:
            self.results[cluster] = []
            for sentence in self.clusters[cluster]:
                self.results[cluster].append((self.policy(sentence), sentence.sentence))
        for cluster in self.results:
            self.results[cluster] = sorted(self.results[cluster], key=lambda tup: tup[0])

    def policy(self, x):
        r = 1 / 2
        s = 1 / 2
        return (abs(x.readibility-self.user.expertise_level) * r) + (self.calculate_similarity(x) * s)

    def calculate_similarity(self, sentence):
        sentence_embeddings = sentence.sentence_embeddings
        sentence_embedded = sentence_embeddings[0]
        for emb in sentence_embedded:
            sentence_embedded = sentence_embedded + emb
        x = np.array(sentence_embedded).reshape(1, -1)
        y = np.array(self.user_taste_embedded_summed[0]).reshape(1, -1)
        return cosine_similarity(x, y)

    def auto(self):
        self.eliminate_duplicates()  # Toglie i duplicati dall'input della classe
        self.heuristic_filter()  # Toglie le frasi insensate dall'input della classe
        self.create_clusters()  # In self.clusters crea un dizionario keyword - frasi
        self.sum_user_tastes_embedded()
        self.apply_policy()  # Usa il criterio readibility - similiarity per ordinare le frasi

    def sum_user_tastes_embedded(self):
        keys = list(self.user_taste_embedded.keys())
        aux = self.user_taste_embedded[keys[0]]
        for key in keys[1:]:
            aux += self.user_taste_embedded[key]
        self.user_taste_embedded_summed = aux


    def print_results(self, n):
        for cluster in self.results:
            print("Results for " + cluster + " (the lower the number, the better the sentence):")
            for sentence in self.results[cluster][:n]:
                print(str(sentence[0]) + ": " + sentence[1])

