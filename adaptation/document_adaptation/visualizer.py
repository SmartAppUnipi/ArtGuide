"""
    visualization.py: class file that implements all the features required to visualize the debug information
    ArtGuide project SmartApp1920
    Dipartimento di Informatica Università di Pisa
    Authors: M. Barato, S. Berti, M. Bonsembiante, P. Lonardi, G. Martini
    We declare that the content of this file is entirelly
    developed by the authors
"""
import numpy as np
from torch.utils.tensorboard import SummaryWriter
from datetime import datetime
from config import config

class _Visualizer():
    """
    Class that define utility functions to use TensorBoard as visualization debug platform
    """
    def __init__(self, log_dir="./visualizer_logs", flush_secs=120, filename_suffix='adaptation_'):
        self.timestamp = datetime.now()
        self.writer = SummaryWriter(log_dir = log_dir, flush_secs=flush_secs, filename_suffix=filename_suffix, comment=str(self.timestamp))

    def add_embedding(self, vectors, metadata, metadata_header, tag=None):
        """
        Append given embeddings and informations to SummaryWriter
        @param vectors: list of embeddings' matrix
        @param metadata: list of records that describe the correspondent vector
        @param metadata_header: header of metadata columns
        @return None
        """
        if not tag:
            tag = "main_"+str(datetime.now())
        vectors = np.array(vectors)
        self.writer.add_embedding(vectors, metadata, metadata_header=metadata_header, global_step=tag)

    def close(self):
        self.writer.close()

Visualizer = _Visualizer()