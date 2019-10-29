# SDAIS = Smart Deep AI for Search 
# Commentiamo tutte le funzioni e classi seguendo formato Doxygen



class DocumentAdaptation():
    def __init__(self):
        pass

    # Input: json contenente informazioni dell'utente passate dall'applicazione
    # Out: serie di keyword da passare a SDAIS per la generazione di queries specializzate
    # Formato output: [ [*, *, * ,*, ...], // keywords nella stessa lista collegate da clausola AND
    #                   [*, *, * ,*, ...], // clausola OR specificata da più liste
    #                   [*, *, * ,*, ...],
    #                 ]
    def get_keywords(self, user_info):
        pass

    # Input: json contenente articoli ricevuti da SDAIS 
    # Out: articolo filtrato im base alle preferenze dell'utente 
    # Formato output: string
    # Proto: il primo articolo per ora può andare bene
    def get_tailored_text(self, texts):
        pass
    

    