from pathlib import Path

seed = 1234

# ----- directories ----- #
results = Path('./checkpoints').resolve()
checkpoints = Path('./res').resolve()
datasets = Path('./data/').resolve()

# ----- files ----- #
wwymak_architecture = datasets / 'arcDataset'
arch_style = datasets / 'arch_style'

painter_by_numbers = datasets / 'train_1'
# Default pict style dataset name after preprocessing
pict_style = datasets / 'pict_style'
# painter_by_numbers metainf
pict_info = datasets / 'all_data_info.csv'

# ----- splits ----- #
arch_splits = datasets / 'arch_splits'
pict_splits = datasets / 'pict_splits'

# ----- tensorflow dataset ----- #
tf_archstyle = str(arch_style / '*')
tf_pictstyle = str(pict_style / '*')

# ----- splits ----- #
tf_archstyle_train = str(arch_splits / 'train/*')
tf_archstyle_eval = str(arch_splits / 'eval/*')
tf_archstyle_test = str(arch_splits / 'test/*')

tf_pict_train = str(pict_splits / 'train/*')
tf_pict_eval = str(pict_splits / 'eval/*')
tf_pict_test = str(pict_splits / 'test/*')
