### Loading the datasets
```
import codebase as cb

# Load the dataframes from dataset files (min_size default is [250, 250])
pict_df, arch_df = cb.load_data(max_size=[2000, 2000])

# Image -> picture/architecture
art_or_building = cb.get_art_or_building(pict_df, arch_df)
# Image -> picture_style (136 total styles)
whats_style_pict = cb.get_whats_style(pict_df)
# Image -> architecture_style (25 styles total)
whats_style_arch = cb.get_whats_style(arch_df)

# Stratified sampling
dsample = cb.stratified_sample(art_or_building, col='style', frac=.01)
art_or_building = cb.load_imgs(art_or_building)
# Getting data for tensorflow
x_aob, y_aob = cb.to_tf(art_or_building)
```