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

# ----- tensorflow dataset ----- #
tf_archstyle = str(arch_style / '*')
tf_pictstyle = str(pict_style / '*')
