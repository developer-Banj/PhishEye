import re
import string
from nltk.corpus import stopwords

stop_words = set(stopwords.words('english'))

def text_preprocessing(text):
    text = str(text).lower()
    text = re.sub('\[.*?\]', '', text)
    text = re.sub('@\w+\s*', '', text)
    text = re.sub("\\W"," ",text) 
    text = re.sub('https?://\S+|www\.\S+', '', text)
    text = re.sub('http', '', text)
    text = re.sub('<.*?>+', '', text)
    text = re.sub('[%s]' % re.escape(string.punctuation), '', text)
    text = re.sub('\n', '', text)
    text = re.sub('\w*\d\w*', '', text)
    return text

def drop_stopwords(text):
    return ' '.join([w for w in text.split() if w not in stop_words])

def delete_one_characters(text):
    return ' '.join([w for w in text.split() if len(w) > 1])
