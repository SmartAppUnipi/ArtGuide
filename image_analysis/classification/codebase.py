import os
import json
import argparse
from argparse import RawTextHelpFormatter
from PIL import Image
import pathlib

import numpy as np
import math
import re
import numpy as np
import pandas as pd
import tensorflow as tf
import shutil

import project_types as pt

CROP_SIZE = [300, 300, 3]


# ----- ----- TENSORFLOW ARCHITECTURE ----- ----- #

def check_file(path, fname, duplicate=True):
    abs_path = pathlib.PurePath(path, fname)
    fpath = str(abs_path).lower()
    # Extension
    if not fpath.endswith(('jpg', 'jpeg')):
        return False
    # Dimension
    try:
        width, height = Image.open(str(abs_path)).size
        return (min(int(width), int(height)) > CROP_SIZE[0])
    except Exception as e:
        print(str(e))
        print(f"Undable to read: {abs_path}")
        return False


def preprocess_architecture(n_path, duplicate=True):
    arch_styles = [
        'Achaemenid architecture', 'American Foursquare architecture', 'American craftsman style',
        'Ancient Egyptian architecture', 'Art Deco architecture', 'Art Nouveau architecture',
        'Baroque architecture', 'Bauhaus architecture', 'Beaux-Arts architecture',
        'Byzantine architecture', 'Chicago school architecture', 'Colonial architecture',
        'Deconstructivism', 'Edwardian architecture', 'Georgian architecture',
        'Gothic architecture', 'Greek Revival architecture', 'International style',
        'Novelty architecture', 'Palladian architecture', 'Postmodern architecture',
        'Queen Anne architecture', 'Romanesque architecture', 'Russian Revival architecture',
        'Tudor Revival architecture',
    ]
    arch_map2style = {v: idx for (idx, v) in enumerate(arch_styles)}
    with open("idx2archstyle.json", 'w') as fp:
        mapIdx2Style = { idx: v for (idx, v) in enumerate(arch_styles) }
        json.dump(mapIdx2Style, fp)

    arch_idx = 0
    for path, subdirs, files in os.walk(pt.wwymak_architecture):
        if subdirs != []:
            continue
        
        style_subdir = path.split('/')[-1]
        for f in files:
            if not check_file(path, f):
                continue
            style_idx = arch_map2style[style_subdir]
            style = style_subdir.replace(' ', '_')
            new_fname = f"{style_idx}__{style}__{arch_idx}"
            
            new_path = pt.datasets / n_path / (new_fname + ".jpg")
            abs_path = pathlib.PurePath(path, f)
            
            if not duplicate:
                shutil.move(abs_path, new_path)
            else:
                shutil.copyfile(abs_path, new_path)
            
            arch_idx = arch_idx + 1


def parse_arch_pict(filename, linux=True):
    if not linux:
        filename = tf.strings.regex_replace(filename, '\\\\', '/')
    fname = tf.strings.split(filename, '/')[-1]
    one_hot_idx = tf.strings.split(fname, '__')[0]
    one_hot_idx = tf.strings.to_number(one_hot_idx, out_type=tf.float32)
    
    label = tf.one_hot(int(one_hot_idx), 25)
    
    image = tf.io.read_file(filename)
    image = tf.image.decode_jpeg(image)
    if tf.shape(image)[-1] < 3:
        image = tf.image.grayscale_to_rgb(image)
    image = tf.image.convert_image_dtype(image, tf.float32) / 255
    image = tf.image.random_crop(image, CROP_SIZE)
    return image, label


def arch_data_input(dataset='train', batch_size=32):
    list_ds = tf.data.Dataset.list_files(pt.tf_archstyle)
    list_ds = list_ds.map(parse_arch_pict)
    list_ds = list_ds.batch(batch_size)
    return list_ds


# ----- ----- TENSORFLOW PICTURE ----- ----- #
def preprocess_pict(n_path, duplicate=True):
    """Prepare the dataset found in {pt.pict_dset} such that each image has the name: 
        {style_idx}__{style_name}__{img_idx} with style_idx the index associated with the style
    Keyword arguments:
        n_path  --  the new path to use
        move  --  if False the old files will be deleted
    """
    pictdf = pd.read_csv(pt.pict_info, index_col='new_filename').drop('date', axis=1)
    pictdf = pictdf.dropna(subset=['style', 'pixelsx', 'pixelsy'])
    # Dataset fix Note: new realism and noveau realism are the same style
    pictdf['style'] = pictdf['style'].apply(lambda x: 'Nouveau Réalisme' if x=='New Realism' else x)
    # Discarding low cardinality samples
    good_styles = (pictdf['style'].value_counts()>100)
    good_styles = good_styles[good_styles]
    pictdf = pictdf[pictdf['style'].isin(good_styles.index)]
    # Ignorinng not existing
    pictdf = pictdf[pictdf.apply(lambda row: os.path.exists(pt.painter_by_numbers / row.name), axis=1)]
    
    # One hot index
    styles = pictdf["style"].unique()
    styles.sort()
    map2style = { v: idx for (idx, v) in enumerate(styles) }
    with open("idx2pictstyle.json", 'w') as fp:
        mapIdx2Style = { idx: v for (idx, v) in enumerate(styles) }
        json.dump(mapIdx2Style, fp)

    pictdf["style_idx"] = pictdf["style"].map(map2style)
    # Recreating dataset
    for (fpath, row) in pictdf.iterrows():
        # Ignoring small images
        if min(int(row.pixelsx), int(row.pixelsy)) < CROP_SIZE[0]:
            continue
        # Moving or copying Keyword arguments:the file 
        try:
            new_fname = f"{row['style_idx']}__{row['style'].replace(' ', '_')}__{str(fpath)}"
            new_path = pt.datasets / n_path / new_fname
            old_path = pt.painter_by_numbers / fpath
            if not duplicate:
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
    image = tf.image.convert_image_dtype(image, tf.float32) / 255
    image = tf.image.random_crop(image, CROP_SIZE)
    return image, label


def tf2wd(model_prediction_tf, art_type='picture'):
    """Convert a model prediction to a dictionary {"WDId": v} with {v} the value predicted by the model for each style
    INPUT 
        model_prediction_tf - tensor returned by the model
        art_type            - 'architecture' or 'picture' 
    """ 
    res = {}
    prediction = list(map(int, list(model_prediction_tf)))
    if art_type == "picture":
        idx_style_map = IDX_2_PICTSTYLE 
        style_2_wd = PICTSTYLE_2_WD 
    else:
        idx_style_map = IDX_2_ARCHSTYLE
        style_2_wd = ARCHSTYLE_2_WD

    for idx, stylename in idx_style_map.items():
        wd_id = style_2_wd[stylename]
        res[wd_id] = prediction[int(idx)]
    return res


descr = """Ensure to have the following file structure
image_analysis/models/
├── project_types.py 
├── ... 
├── codebase.py 
├── data/ 
   ├── all_data_info.csv (https://www.kaggle.com/c/painter-by-numbers/)
   ├── train_1/ (dataset from painters-by-numbers, keep consistency with project_types.py->painter_by_numbers) 
   ├── arcDataset/ (https://www.kaggle.com/wwymak/architecture-dataset) 
"""
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=descr, formatter_class=RawTextHelpFormatter)
    parser.add_argument('-d', action='store_true', help="If specified the old dataset will be kept")
    args = parser.parse_args()

    if not os.path.exists(pt.pict_style):
        os.mkdir(pt.pict_style)
    preprocess_pict(pt.pict_style, args.d)

    if not os.path.exists(pt.arch_style):
        os.mkdir(pt.arch_style)
    #preprocess_architecture(pt.arch_style, args.d)
else:
    try:
        with open("dpictstyle2wd.json", "r") as f:
            # picture style name to wikidata identifier
            PICTSTYLE_2_WD = json.load(f)
    except IOError:
        print("file not found pictstyle2wd")

    try:
        with open("idx2pictstyle.json", "r") as f:
            # picture style name to index in the model output
            IDX_2_PICTSTYLE = json.load(f)
    except :
        print("file not found pictstyle2idx")

    try:
        with open("darchstyle2wd.json", "r") as f:
            # picture style name to wikidata identifier
            ARCHSTYLE_2_WD = json.load(f)
    except :
        print("file not found archstyle2wd.json")

    try:
        with open("idx2archstyle.json", "r") as f:
            # picture style name to index in the model output
            IDX_2_ARCHSTYLE = json.load(f)
    except :
        print("file not found archstyle2idx.json")



