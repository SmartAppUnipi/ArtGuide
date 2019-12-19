import sys
import os
import shutil
import pickle

import tensorflow as tf
import efficientnet.tfkeras as efn

import codebase as cb


class DenseEfficientNet(tf.keras.Model):

    def __init__(self, outputs, trainable_blocks=[]):
        super(DenseEfficientNet, self).__init__()
        self.eff_net = efn.EfficientNetB4(
            include_top=False, 
            input_shape=(300, 300, 3), 
            weights='imagenet',
            pooling='avg'
        )
        for l in self.eff_net.layers:
            l.trainable = any([(b in l.name) for b in trainable_blocks]) or isinstance(l, tf.keras.layers.BatchNormalization)
        self.b_norm = tf.keras.layers.BatchNormalization()
        self.dense_1 = tf.keras.layers.Dense(2048, activation='tanh')
        self.dense_2 = tf.keras.layers.Dense(outputs)
        self.softmax = tf.keras.layers.Softmax()

    def call(self, batch):
        x = self.eff_net(batch)
        x = self.b_norm(x)
        x = self.dense_1(x)
        x = self.dense_2(x)
        x = self.softmax(x)
        return x
    

def create_model(outputs, trainable_blocks=[]):
    model = DenseEfficientNet(outputs, trainable_blocks)
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    
    return model


if __name__ == '__main__':
    data = sys.argv[1]
    if len(sys.argv) > 2 and sys.argv[2] is not None:
        trainable_blocks = [ f'block{i}' for i in sys.argv[2].split(',')]
    else:
        trainable_blocks = []
    
    if data == 'paint':
        classes = 73
        train_set = cb.pict_data_input('train')
        eval_set = cb.pict_data_input('eval')
    elif data == 'arch':
        classes = 25
        train_set = cb.arch_data_input('train')
        eval_set = cb.arch_data_input('eval')

    cp_dir = f'eff_dir_{data}/'
    shutil.rmtree(cp_dir, ignore_errors=True)
    os.makedirs(cp_dir)

    print("Creating Model")
    model = create_model(classes, trainable_blocks)

    stats = {
        'train': {
            'loss': [],
            'accuracy': []
        },
        'eval': {
            'loss': [],
            'accuracy': []
        }
    }

    print("Starting Epochs")

    best_loss = 1e10
    patience = 0
    for i in range(100):
        history = model.fit(
            train_set,
            epochs=1,
        )
        stats['train']['loss'].append(history.history['loss'])
        stats['train']['accuracy'].append(history.history['accuracy'])

        loss, accuracy = model.evaluate(eval_set)
        stats['eval']['loss'].append(loss)
        stats['eval']['accuracy'].append(accuracy)

        with open(f'stats_{data}.pickle', 'wb') as fp:
            pickle.dump(stats, fp, protocol=pickle.HIGHEST_PROTOCOL)

        if loss < best_loss - 1e-5:
            model.save(cp_dir)
            best_loss = loss
            patience = 0
            print("epoch: " + str(i))
            print("")
        else:
            if patience < 10:
                patience += 1
            else:
                break
