import os

import cv2
import re
import numpy as np
import pandas as pd
import tensorflow as tf
import imagesize

import project_types as pt

CROP_SIZE = [256, 256, 3]

# Name, ID, StartYear, EndYear
arch_info = {
    'Achaemenid architecture': [1, -550, -220],
    'American Foursquare architecture': [2, 1890, 1930],
    'American craftsman style': [3, 1860, 1930],
    'Ancient Egyptian architecture': [5, -2580, -2400],
    'Art Deco architecture': [8, 1930, 2000],
    'Art Nouveau architecture': [9, 1895, 1915],
    'Baroque architecture': [10, 1600, 1700],
    'Bauhaus architecture': [11, 1919, 1933],
    'Beaux-Arts architecture': [12, 1671, 1968],
    'Byzantine architecture': [15, 600, 800],
    'Chicago school architecture': [17, 1900, 1970],
    'Colonial architecture': [20, 1600, 1900],
    'Deconstructivism': [22, 1980, 2000],
    'Edwardian architecture': [26, 1901, 1914],
    'Georgian architecture': [30, 1720, 1840],
    'Gothic architecture': [31, 1200, 1600],
    'Greek Revival architecture': [33, 1800, 1900],
    'International style': [37, 1920, 1930],
    'Novelty architecture': [52, 1900, 2000],
    'Palladian architecture': [53, 1500, 1900],
    'Postmodern architecture': [55, 1970, 2000],
    'Queen Anne architecture': [58, 1880, 1910],
    'Romanesque architecture': [62, 800, 1200],
    'Russian Revival architecture': [64, 1825, 1917],
    'Tudor Revival architecture': [69, 1900, 1920],
}


def size_no_read(t_path):
    try:
        m = magic.from_file(t_path)
    except:
        print(f'can\'t read {t_path}')
        return [np.nan, np.nan]
    ftype = m.lower().split(' ')[0] 

    if ftype=='jpg' or ftype=='jpeg':
        str_size = re.findall('(\d+)x(\d+)', magic.from_file(t_path))[-1]
    elif ftype=='png': 
        str_size = re.findall('(\d+) x (\d+)', magic.from_file(t_path))[0]
    else:
        print(f'Filetype not supported: {m}')
        return [np.nan, np.nan]
    return list(map(int, str_size))


def stratified_sample(t_df, col=None, frac=.1, n=None):
    if not col:
        raise ValueError('Sample column not specified')
    return t_df.groupby(col, group_keys=False).apply(lambda x: x.sample(n, frac))


def load_data(t_balance=True, min_size=CROP_SIZE[:2], max_size=[]):
    arch = pd.DataFrame([], columns=['art_class', 'style', 'year_start', 'year_end', 'abs_path'])
    # loading architecture ----- #
    dir_list = [x for x in os.walk(pt.arch_dset)]
    for abs_path, _, image_files  in dir_list[1:]:
        style = os.path.basename(abs_path)
        imgs_files = [str(abs_path+'/'+x) for x in image_files if x.lower().endswith(('.jpg', '.jpeg'))]
        if len(imgs_files)==0:
            continue
        aus = pd.DataFrame(imgs_files, columns=['abs_path'])
        aus['art_class'] = 'architecture'
        aus['style'] = style
        aus['year_start'] = arch_info[style][1]
        aus['year_end'] = arch_info[style][2]
        arch = pd.concat([arch, aus], sort=False)

    # pictures ----- #
    pict = pd.read_csv(pt.pict_info).drop('date', axis=1)
    pict = pict.dropna()
    pict = pict[pict.in_train]
    pict['art_class'] = 'picture'
    pict['abs_path'] = (str(pt.pict_dset) + '/') + pict.new_filename 
    # filtering existing images
    pict = pict[pict.abs_path.apply(os.path.exists)]
    
    # filtering images with size (not very clean) ----- #
    lambda_no_read = lambda x: pd.Series(imagesize.get(x))
    pict[['width', 'height']] = pict.abs_path.apply(lambda_no_read)
    # pict = pict.dropna()
    lambda_no_read_1 = lambda x: pd.Series(imagesize.get(x))
    arch[['width', 'height']] = arch.abs_path.apply(lambda_no_read)
    # arch = arch.dropna()
    if len(min_size) != 0:
        min_width, min_height = min_size
        pict = pict[(pict.width > min_width) & (pict.height>min_height)]
        arch = arch[(arch.width > min_width) & (arch.height>min_height)]
    if len(max_size) != 0:
        max_width, max_height = max_size
        pict = pict[(pict.width < max_width) & (pict.height < max_height)]
        arch = arch[(arch.width < max_width) & (arch.height < max_height)]

    # balancing dataset
    if t_balance and len(pict)>len(arch):
        pict = pict.sample(len(arch))
    return pict, arch


def load_and_reshape(t_path):
    img = cv2.imread(t_path, cv2.COLOR_BGR2RGB)
    if len(img.shape)<3:
        return np.nan
    if img.shape[0]<CROP_SIZE[0] or img.shape[1]<CROP_SIZE[1]:
        return np.nan
    t = tf.convert_to_tensor(img, dtype=np.float32)
    return tf.image.random_crop(img, CROP_SIZE)


def load_imgs(samples, drop_abs_path=True):
    samples_imgs = samples.abs_path.map(load_and_reshape)
    
    if drop_abs_path:
        samples_imsg = samples.drop('abs_path', axis=1, inplace=True)
    samples['img'] = samples_imgs 
    
    return samples.dropna()


def get_art_or_building(t_arch_df, t_pict_df):
    columns = ['art_class', 'abs_path']
    merged_df = pd.concat([t_arch_df[columns], t_pict_df[columns]]) 
    
    return merged_df


def get_whats_style(t_df):
    return t_df[['style', 'abs_path']] 
