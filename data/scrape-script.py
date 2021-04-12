import sys
import pymysql
import time
import re
import unicodedata
import math
import string
import json
from pprint import pprint

import pandas as pd
import requests
import logging
import time
import urllib2
import csv

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


reload(sys)
sys.setdefaultencoding("utf-8")


conn = pymysql.connect(host='127.0.0.1', unix_socket='/Applications/MAMP/tmp/mysql/mysql.sock', user='root', passwd='root', db='music_map', charset='utf8')

cursor = conn.cursor(pymysql.cursors.DictCursor)

date_range = "20210315"
output_filename = '/Applications/MAMP/htdocs/music-map-updating/data/test.csv'
# Set your input file here

# driver.set_page_load_timeout(1)

def main():
    with open('/Applications/MAMP/htdocs/music-map-updating/data/test.csv', 'a') as csvfile:
        writer = csv.writer(csvfile, delimiter=',',
                            quotechar='|', quoting=csv.QUOTE_MINIMAL)
        #driver = webdriver.Firefox(executable_path = '/usr/local/bin/geckodriver')
        driver = webdriver.Firefox(executable_path = '/Users/mattdaniels/Downloads/geckodriver_3')


        cursor = conn.cursor(pymysql.cursors.DictCursor)

        # cursor.execute("SELECT track_link, location_id, '' as geonameid, '' as google_place_id FROM 2021_march_country WHERE track_link NOT IN ( SELECT track_link FROM 2021_march_city GROUP BY 1 ) group by 1")
        # # cursor.execute("SELECT location_id, '' as geonameid, google_place_id FROM country_views group by 1")
        # cursor.execute("SELECT * FROM location_id_cities_global WHERE geonameid > 0 and location_id in ( select location_id from city_views_global where artist_name <> '' ) AND google_place_id <> '' ORDER BY geonameid ASC")

        result_set = cursor.fetchall()
        results = []
        for row in result_set:
            #location = "0x47c17d64edf39797:0x47ebf2b439e60ff2"
            print "new row"

            location = row['location_id']
            geonameid = row['geonameid']
            place_id = row['google_place_id']
            #url = "https://artists.youtube.com/insights/location?date_params_start_time=2018-04-25T00%3A00%3A00Z&date_params_end_time=2018-05-25T00%3A00%3A00Z&date_params_interval=DAY&location_params_id="+location
            url = "https://charts.youtube.com/location/"+location+"?date_start=2021-02-15&date_end=2021-03-15"

            driver.get(url)

            try:
                element = WebDriverWait(driver, 10).until(
                    #EC.presence_of_element_located((By.ID, "bar"))
                    EC.presence_of_element_located((By.ID, "view-more-button-charts"))
                )
                soup = BeautifulSoup(driver.page_source, 'html.parser')
                #top_tracks = soup.findAll('div',attrs={'class':'top-tracks-card'})
                top_tracks = soup.findAll('div',attrs={'class':'ytmc-tracks-card'})


                if len(top_tracks) == 0:
                    print "error"
                    row = [geonameid,'','','','','',location.strip(),'',date_range]
                    print row
                    writer.writerow([unicode(s).encode("utf-8") for s in row])
                else:
                    print "success"
                        #tracks = div.findAll('div',attrs={'class':'tracks-metadata'})
                    tracks = soup.findAll('div',attrs={'class':'track-entity-row-top'})
                    for idx, track in enumerate(tracks):
                        artist_name = ""
                        artist_link = ""
                        track_name = ""
                        track_link = ""
                        view_count = ""

                        entity = track.findAll('ytmc-entity-row')
                        for a in entity:
                            track_link = a['track-video-id']
                        #print track_link.strip()

                        text = track.findAll('span',attrs={'class':'ytmc-ellipsis-text'})
                        for part, a in enumerate(text):
                            if part == 0:
                                track_name = a.text.strip()
                            if part == 1:
                                view_count = a.text.strip()


                        artist_list = track.findAll('span',attrs={'class':'ytmc-artist-name'})
                        print "artist_list"
                        for part, a in enumerate(artist_list):
                            if(part == 0):
                                artist_name = a.text.strip()
                            else:
                                artist_name = artist_name + ", "+a.text.strip()
                        print artist_name

                        row = [geonameid,view_count.strip().replace(',','').replace(' views','').replace('<',''),artist_name.strip(),artist_link.strip(),track_name.strip(),track_link.strip(),location.strip(),idx,date_range,place_id]
                        # print row
                        writer.writerow([unicode(s).encode("utf-8") for s in row])
                    results.append(row)
            except:
                print "fail"
                row = [geonameid,'','','','','',location.strip(),'',date_range,place_id]
                print row
                writer.writerow([unicode(s).encode("utf-8") for s in row])
                pass


            # finally:
            #     driver.quit()

        # pd.DataFrame(results).to_csv(output_filename, encoding='utf8')

if __name__ == '__main__':
    main()
