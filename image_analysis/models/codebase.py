import os

import cv2
import math
import re
import numpy as np
import pandas as pd
import tensorflow as tf
import imagesize

import project_types as pt

CROP_SIZE = [300, 300, 3]

arch_styles = [
    'Achaemenid architecture',
    'American Foursquare architecture',
    'American craftsman style',
    'Ancient Egyptian architecture',
    'Art Deco architecture',
    'Art Nouveau architecture',
    'Baroque architecture',
    'Bauhaus architecture',
    'Beaux-Arts architecture',
    'Byzantine architecture',
    'Chicago school architecture',
    'Colonial architecture',
    'Deconstructivism',
    'Edwardian architecture',
    'Georgian architecture',
    'Gothic architecture',
    'Greek Revival architecture',
    'International style',
    'Novelty architecture',
    'Palladian architecture',
    'Postmodern architecture',
    'Queen Anne architecture',
    'Romanesque architecture',
    'Russian Revival architecture',
    'Tudor Revival architecture',
]

# ----- ----- TENSORFLOW ARCHITECTURE ----- ----- #
one_hot_arch = tf.one_hot(range(len(arch_styles)), len(arch_styles))
tflabels_arch = {style: one_hot_arch[idx] for idx, style in enumerate(arch_styles)}


def archstyle2str(tf_vect):
    return arch_styles[tf.math.argmax(tf_vect)]


def parse_image_arch(filename):
    fname = tf.strings.split(filename, '/')[-1]
    label = tf.strings.split(fname, '_')[0]
    label_str = str(label.numpy(), 'utf-8')
    label_tf = tflabels_arch[label_str]

    image = tf.io.read_file(filename)
    image = tf.image.decode_jpeg(image)
    image = tf.image.convert_image_dtype(image, tf.float32)
    image = tf.image.random_crop(image, CROP_SIZE)
    return image, label_tf


# ----- ----- TENSORFLOW PICTURE ----- ----- #
# Manipulating dataframe
pictdf = pd.read_csv(pt.pict_info, index_col='new_filename').drop('date', axis=1)
pictdf = pictdf.dropna(subset=['style'])
# Getting one hot
pict_styles = pictdf['style'].unique()
one_hot_pict = tf.one_hot(range(len(pict_styles)), len(pict_styles))
tflabels_pict = {style: one_hot_pict[idx] for idx, style in enumerate(pict_styles)}


def pictstyle2str(tf_vect):
    return pict_styles[tf.math.argmax(tf_vect)]


def parse_image_pict(filename):
    fname = tf.strings.split(filename, '/')[-1]
    fname_str = str(fname.numpy(), 'utf-8')
    try:
        pictdf_row = pictdf.loc[fname_str]
    except:
        print(f'not found {filename}')
        return None, None
    label_tf = tflabels_pict[pictdf_row.style]

    image = tf.io.read_file(filename)
    image = tf.image.decode_jpeg(image)
    image = tf.image.convert_image_dtype(image, tf.float32)
    image = tf.image.random_crop(image, CROP_SIZE)
    return image, label_tf
