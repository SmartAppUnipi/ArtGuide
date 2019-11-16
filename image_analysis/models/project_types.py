from pathlib import Path

seed = 1234
# ----- directories ----- #
results = Path('./checkpoints').resolve()
checkpoints = Path('./res').resolve()
datasets = Path('./data/').resolve()

# ----- files ----- #
arch_dset = datasets / 'arcDataset'
pict_dset = datasets / 'train_1'
pict_info = datasets / 'all_data_info.csv'

