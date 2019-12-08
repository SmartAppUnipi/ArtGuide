import os
import cv2

import argparse
from argparse import RawTextHelpFormatter

import numpy as np
import math
import re
import numpy as np
import pandas as pd
import tensorflow as tf
import imagesize
import shutil

import project_types as pt

CROP_SIZE = [299, 299, 3]

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


def parse_image_arch(filename, linux=True):
    if not linux:
        filename = tf.strings.regex_replace(filename, '\\\\', '/')
    fname = tf.strings.split(filename, '/')[-1]
    label = tf.strings.split(fname, '_')[0]

    image = tf.io.read_file(filename)
    image = tf.image.decode_jpeg(image)
    image = tf.image.convert_image_dtype(image, tf.float32)
    image = tf.image.random_crop(image, CROP_SIZE)
    return image, label


# ----- ----- TENSORFLOW PICTURE ----- ----- #
def convert_paths(n_path, duplicate=True, min_side=200):
    """Prepare the dataset found in {pt.pict_dset} such that each image has the name: 
        {style_idx}__{style_name}__{img_idx} with style_idx the index associated with the style
    Keyword arguments:
        n_path  --  the new path to use
        move  --  if False the old files will be deleted
        min_side  --  images with lenght or width less than {min_side} will be discarded
    """
    # Loading painters by artist meta inf.
    pictdf = pd.read_csv(pt.pict_info, index_col='new_filename').drop('date', axis=1)
    pictdf = pictdf.dropna(subset=['style', 'pixelsx', 'pixelsy'])
    pictdf = pictdf[pictdf.apply(lambda row: os.path.exists(pt.painter_by_numbers / row.name), axis=1)]
    # One hot index
    styles = enumerate(pictdf['style'].unique())
    map2style = {v: idx for (idx, v) in styles}
    pictdf['style_idx'] = pictdf['style'].map(map2style)
    # Recreating dataset
    for (fpath, row) in pictdf.iterrows():
        # Ignoring small images
        if min(row.pixelsx, row.pixelsy) < 200:
            continue
        # Moving or copying Keyword arguments:the file 
        try:
            new_fname = f"{row['style_idx']}__{row['style'].replace(' ', '_')}__{str(fpath)}"
            new_path = pt.datasets / n_path / new_fname
            old_path = pt.painter_by_numbers / fpath
            if duplicate:
                shutil.move(old_path, new_path)
            else:
                shutil.copyfile(old_path, new_path)
        except IOError as err:
            print("I/O error: {0}".format(err))


def parse_image_pict(filename, linux=True):
    if not linux:
        filename = tf.strings.regex_replace(filename, '\\\\', '/')
    fname = tf.strings.split(filename, '/')[-1]
    one_hot_idx = tf.strings.split(fname, '__')[0]
    one_hot_idx = tf.strings.to_number(one_hot_idx, out_type=tf.float32)
    
    label = tf.one_hot(int(one_hot_idx), 136)
    
    image = tf.io.read_file(filename)
    image = tf.image.decode_jpeg(image)
    image = tf.image.convert_image_dtype(image, tf.float32)
    image = tf.image.random_crop(image, CROP_SIZE)
    return image, label


descr = """Ensure to have the following file structure
image_analysis/models/
├── project_types.py 
├── ... 
├── codebase.py 
├── data/ 
   ├── all_data_info.csv (https://www.kaggle.com/c/painter-by-numbers/)
   ├── train_1/ (keep consistency with project_types.py->pict_dset) 
   ├── arch_style_v1/ (http://bit.ly/arch_style_v1) 
"""
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=descr, formatter_class=RawTextHelpFormatter)
    parser.add_argument('-d', action='store_true', help="If specified the old dataset will be kept")
    args = parser.parse_args()

    if not os.path.exists(pt.pict_style):
        os.mkdir(pt.pict_style)
    convert_paths(pt.pict_style, args.d)
