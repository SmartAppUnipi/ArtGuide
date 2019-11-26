import os
from glob import glob

class DataLoader():
    def __init__(self, texts=None, data_dir=None, topics=[], separator='_', isHTML=False, normalize=True) :
        self.texts = texts
        self.texts_topics = []
        self.texts_info = []
        self.data_dir = data_dir
        self.topics = topics
        self.isHTML = isHTML
        self.separator = '_'
        if data_dir:
            if not self.texts: self.texts = []
            self.load_from_dir(data_dir)
        if isHTML:
            self.clean_from_HTML()
        if normalize:
            self.normalize()


    def __item__(self, index):
        return self.texts[index]


    def __len__(self):
        return len(self.texts)


    def __iter__(self):
        for i in range(self.__len__()):
            yield self.__item__(i)


    def info(self, index):
        return self.texts_info[index]


    def load_from_dir(self, path):
        # Search files in directory
        files = glob(path+'*.txt')
        if len(files) == 0:
            files = glob(os.path.join(path,'*.txt'))

        for file in files:
            # Extract file info
            info = file.split('_')
            if len(info)>0:
                info[0] = os.path.basename(info[0])
            if len(info)>1:
                self.texts_topics.append(os.path.basename(info[1]))
            self.texts_info.append(info)

            with open(file) as f:  
                self.texts.append( f.read() ) 

    def clean_from_HTML(self):
        pass

    def normalize(self):
        pass        


        

    