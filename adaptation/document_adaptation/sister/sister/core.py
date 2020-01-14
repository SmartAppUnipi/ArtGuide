import numpy as np

from sister.tokenizers import Tokenizer, SimpleTokenizer, JapaneseTokenizer
from sister.word_embedders import WordEmbedding, FasttextEmbedding


class SentenceEmbedding(object):

    def __init__(
            self,
            tokenizer: Tokenizer,
            word_embedder: WordEmbedding) -> None:
        self.tokenizer = tokenizer
        self.word_embedder = word_embedder

    def embed(self, sentence: str) -> np.ndarray:
        raise NotImplementedError

    def __call__(self, sentence: str) -> np.ndarray:
        raise NotImplementedError


class MeanEmbedding(SentenceEmbedding):

    def __init__(
            self,
            lang: str = 'en',
            tokenizer: Tokenizer = None,
            word_embedder: WordEmbedding = None) -> None:
        tokenizer = tokenizer or {"en": SimpleTokenizer(), "ja": JapaneseTokenizer()}[lang]
        word_embedder = word_embedder or FasttextEmbedding(lang)
        super().__init__(tokenizer, word_embedder)

    def embed(self, sentence: str) -> np.ndarray:
        tokens = self.tokenizer.tokenize(sentence)
        vectors = self.word_embedder.get_word_vectors(tokens)
        return np.mean(vectors, axis=0)

    def __call__(self, sentence: str) -> np.ndarray:
        return self.embed(sentence)
