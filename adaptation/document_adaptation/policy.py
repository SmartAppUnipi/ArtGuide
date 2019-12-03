from sklearn.metrics.pairwise import cosine_similarity
import json

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
    def __init__(self, sentences, keywords, user):
        self.sentences = sentences
        self.keywords = keywords
        self.user = user
        self.user_taste_embedded = user.tastes_embedded
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

    def create_clusters(self):
        for key in self.keywords:  # Scorro tutte le keywords
            for sentence in self.sentences:  # Scorro tutte le frasi
                sentence.keyword = self.keywords
                if key in sentence.keyword:  # Se la keyword è contenuta nelle keyword della frase
                    x = False  # è presente nel dizionario?
                    for cluster in self.clusters:  # Controlla se la frase è già presente
                        if sentence in self.clusters[cluster]:
                            x = True  # è gia presente nel dizionario
                    if not x:
                        if key in self.clusters:
                            self.clusters[key].append(sentence)
                        else:
                            self.clusters[key] = [sentence]

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
        return cosine_similarity(sentence_embedded.reshape(1, -1), self.user_taste_embedded.reshape(1, -1))

    def auto(self):
        self.eliminate_duplicates()  # Toglie i duplicati dall'input della classe
        self.heuristic_filter()  # Toglie le frasi insensate dall'input della classe
        self.create_clusters()  # In self.clusters crea un dizionario keyword - frasi
        #self.sum_user_tastes_embedded()
        self.apply_policy()  # Usa il criterio readibility - similiarity per ordinare le frasi

    def sum_user_tastes_embedded(self):
        aux = self.user_taste_embedded
        tastes = aux[0]
        for cur in aux[1:]:
            tastes = tastes + cur
        self.user_taste_embedded = aux

    def print_results(self, n):
        for cluster in self.results:
            print("Results for " + cluster + " (the lower the number, the better the sentence):")
            for sentence in self.results[cluster][:n]:
                print(str(sentence[0]) + ": " + sentence[1])

