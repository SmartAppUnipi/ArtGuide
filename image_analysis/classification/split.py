import project_types as pj
import math, glob, os, shutil, random, numpy as np

def copyFromDirToDir(filelist = None, destDir = None, fromDir = None):
    for name in filelist:
        shutil.copy(fromDir+name, destDir)
        
def functionThatMakesThings(datasetPath = '/', directoryWhereToCreate = '/'):
    filesDict = {}
    threeFolders = ['train', 'validation', 'test']
    percentages = [0.8, 0.1, 0.1]
    for dirpath, dnames, filename in os.walk(datasetPath):
        for file in filename:
            if file.split('.')[-1] == 'jpg':
                fileName = file.split('__')[0]
                if fileName in filesDict:
                    filesDict[fileName].append(file)
                else:
                    filesDict[fileName] = [file]
    
    for folder in threeFolders:
        if os.path.isdir(directoryWhereToCreate+folder):
            shutil.rmtree(directoryWhereToCreate+folder)
        os.makedirs(directoryWhereToCreate+folder)
            
    for files in filesDict.values():
        random.shuffle(files)
        lengthFile = len(files)
        trainData = files[:math.floor(lengthFile*0.8)]
        validationData = files[math.floor(lengthFile*0.8):math.ceil(lengthFile*0.9)]
        testData = files[math.ceil(lengthFile*0.9):lengthFile]
        # print(trainData, validationData, testData)
        copyFromDirToDir(fromDir=datasetPath, destDir=directoryWhereToCreate+'train', filelist=trainData)
        copyFromDirToDir(fromDir=datasetPath, destDir=directoryWhereToCreate+'validation', filelist=validationData)
        copyFromDirToDir(fromDir=datasetPath, destDir=directoryWhereToCreate+'test', filelist=testData)

# functionThatMakesThings(datasetPath=str(pj.pict_style)+'/', directoryWhereToCreate=str(pj.pict_splits)+'/')
functionThatMakesThings(datasetPath=str(pj.arch_style)+'/', directoryWhereToCreate=str(pj.arch_splits)+'/')
