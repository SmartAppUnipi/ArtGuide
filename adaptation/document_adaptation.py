# SDAIS = Smart Deep AI for Search 
# Commentiamo tutte le funzioni e classi seguendo formato Doxygen



class DocumentAdaptation():
    def __init__(self):
        pass

    # Input: json contenente informazioni dell'utente passate dall'applicazione
    # Out: serie di keyword da passare a SDAIS per la generazione di queries specializzate
    # Formato output: {
    #                  "keyword1":["keyword1_expanded_1","keyword1_expanded_2","keyword1_expanded_3"],
    #                   "keyword2":["keyword2_expanded_2","keyword2_expanded_3","keyword2_expanded_4"]
    #                   ....
    #                   }
    def get_keywords(self, u_tastes):
        res = {}
        for taste in u_tastes:
            res[taste] = [taste]
        return res

    # Input: json contenente articoli ricevuti da SDAIS 
    # Out: articolo filtrato im base alle preferenze dell'utente 
    # Formato output: string
    # Proto: il primo articolo per ora può andare bene
    def get_tailored_text(self, texts):
        return "Testo di prova"
    

    