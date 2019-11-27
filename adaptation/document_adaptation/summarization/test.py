from summarization import ModelSummarizer
from args import args

txt = '''
The Leaning Tower of Pisa (Italian: Torre pendente di Pisa) or simply the Tower of Pisa (Torre di Pisa [ˈtorre di ˈpiːza, - ˈpiːsa]) is the campanile, or freestanding bell tower, of the cathedral of the Italian city of Pisa, known worldwide for its nearly four-degree lean, the result of an unstable foundation. 

The tower is situated behind the Pisa Cathedral and is the third-oldest structure in the city's Cathedral Square (Piazza del Duomo), after the cathedral and the Pisa Baptistry. 

The height of the tower is 55.86 metres (183.27 feet) from the ground on the low side and 56.67 metres (185.93 feet) on the high side. 

The width of the walls at the base is 2.44 m (8 ft 0.06 in). Its weight is estimated at 14,500 metric tons (16,000 short tons).

The tower has 296 or 294 steps; the seventh floor has two fewer steps on the north-facing staircase. 

The tower began to lean during construction in the 12th century, due to soft ground which could not properly support the structure's weight, and it worsened through the completion of construction in the 14th century. 

By 1990 the tilt had reached 5.5 degrees. The structure was stabilized by remedial work between 1993 and 2001, which reduced the tilt to 3.97 degrees.
'''

txt_ita = '''
La torre di Pisa (popolarmente torre pendente e, a Pisa, la Torre) è il campanile della cattedrale di Santa Maria Assunta, nella celeberrima piazza del Duomo di cui è il monumento più famoso per via della caratteristica pendenza, simbolo di Pisa e fra i simboli iconici d'Italia. 

Si tratta di un campanile a sé stante alto 57 metri (58,36 metri considerando il piano di fondazione) costruito nell'arco di due secoli, tra il dodicesimo e il quattordicesimo secolo. Con una massa di 14.453 tonnellate, vi predomina la linea curva, con giri di arcate cieche e sei piani di loggette. 

La pendenza è dovuta a un cedimento del terreno sottostante verificatosi già nelle prime fasi della costruzione. L'inclinazione dell'edificio misura 3,9° rispetto all'asse verticale. La torre è gestita dall'Opera della Primaziale Pisana, ente che gestisce tutti i monumenti della piazza del Duomo di Pisa. 

È stata proposta come una delle sette meraviglie del mondo moderno.
'''
checkpoint_path = './document_adaptation/summarization/checkpoint/'
test = {"en":[txt], "it":[txt_ita]}

for lang in test:
    texts = test[lang]
    print("###--- Test Extractive Summarization ---###")
    model_ext = ModelSummarizer(args, type="ext", lang=lang, checkpoint_path=checkpoint_path, verbose=True)
    preds = model_ext.inference(texts)

    print("###--- Test Abstractive Summarization ---###")
    model_abs = ModelSummarizer(args, type="abs", lang=lang, checkpoint_path=checkpoint_path, verbose=True)
    preds = model_abs.inference(texts)



