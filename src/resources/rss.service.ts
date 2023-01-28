import type { Flux } from '~~/types/flux'
import type { Article } from '~~/types/article'
import { config } from '../config'
import Parser from 'rss-parser';
import * as crypto from 'crypto';
import { readFileSync, writeFileSync, promises as fsPromises } from 'fs';
import { join } from 'path';
import { stringify } from 'querystring';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { BadRequestException, NotFoundException } from '../utils/exceptions'

export const md5 = (contents: string) => crypto.createHash('md5').update(contents).digest("hex");

const parser = new Parser();

export class RssService {

    sources: Flux[] = <Flux[]> config.flux;

    findAll(): Flux[] {
        return this.sources
    }

    find(id: string): Flux | undefined {
        return this.sources.find(flux => flux.id === id)
    }


    async fetch(id: string, categorie: string) {
        const url = this.find(id)?.url
        if (url) {
            let feed = await parser.parseURL(url)

            feed.items.forEach( async (k, i) => {
                if (feed.items[i].link !== undefined) {
                    // const l: string = feed.items[i].link ?? ''
                    const hash: string = md5(feed.items[i].link ?? '')
                    feed.items[i].md5 = hash
                    feed.items[i].categorie = categorie
                    let known = false;
                    if (hash) {
                        const filename = join(__dirname, '../../cache/', hash)

                        // a-t-on déjà une sauvegarde ?
                        let contents, content
                        try {
                            contents = await fsPromises.readFile(
                                filename,
                                'utf-8',
                            )
                            content = JSON.parse(contents)
                        } catch (e) {
                            console.log("unknown to me my babe", filename)
                        }

                        let toBeSaved = true;

                        // if (content && content.gpt) {
                        //     console.log(">>>>>>>>>>>> I know you my babe", content)
                        //     toBeSaved = false
                        // }

                        // on sauvegarde si besoin l'url associée au hash
                        // on sauvegarde pas si on a déjà fait un travail gpt // pas encore utilisé
                        if (toBeSaved) {
                            await fsPromises.writeFile(filename, JSON.stringify(feed.items[i]), {
                                flag: 'w',
                            });
                        }
                      
                    }
                }
            })

            return feed;
        }

        return undefined;
    }

    async save(article: Article): Promise<Article> {
        if (!article.md5) {
            article.md5 = md5(article.link)
        }
        const filename = join(__dirname, '../../cache/', article.md5)
        await fsPromises.writeFile(filename, JSON.stringify(article), {
            flag: 'w',
        });
        console.log("contenu de l'article écrit", filename)
        return article
    }

    async fetchArticle(hash: string): Promise<Article | undefined> {
        const filename = join(__dirname, '../../cache/', hash)

        let article: Article, contents
        try {
            contents = await fsPromises.readFile(
                filename,
                'utf-8',
            )
            article = JSON.parse(contents)
        } catch(e) {
            throw new NotFoundException('Article introuvable')
        }

        if (article.contenu) {
            return article
        }

        if (article.link) {
            const response = await fetch(article.link)
            if (response.ok) {
                // const body = await response.text();
                let page = '';
                for await (const chunk of response.body) {
                    page += chunk.toString()
                }

                const $ = cheerio.load(page)
                article.contenu = $('.article__paragraph').text()

                // await fsPromises.writeFile(filename, JSON.stringify(article), {
                //     flag: 'w',
                // });
                // console.log("contenu de l'article écrit", filename)
                this.save(article)

                return article
            }
        }

        return undefined
    }

}
