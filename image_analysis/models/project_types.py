from pathlib import Path

seed = 1234
# ----- directories ----- #
results = Path('./checkpoints').resolve()
checkpoints = Path('./res').resolve()
datasets = Path('./data/').resolve()

# ----- files ----- #
art_or_building = datasets / 'art_or_building_v1'
pict_style = datasets / 'pict_style_v1'
arch_style = datasets / 'arch_style_v1'

arch_dset = datasets / 'arcDataset'
pict_dset = datasets / 'train_1'
pict_info = datasets / 'all_data_info.csv'

# ----- tensorflow dataset ----- #
tf_archstyle = str(arch_style / '*')
tf_pictstyle = str(pict_dset / '*')
