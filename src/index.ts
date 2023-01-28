import cors from 'cors'
import express from 'express'
import dotenv from 'dotenv'
import { config } from './config'
import { ApiController } from './resources/api/openai.controller'
import { ExceptionsHandler } from './middlewares/exceptions.handler'
import { UnknownRoutesHandler } from './middlewares/unknownRoutes.handler'
import { RssService } from './resources/rss.service'
import { Article } from '~~/types/article'
import { OpenAIService } from './resources/openai.service'
import { NotFoundException } from './utils/exceptions'

dotenv.config();
const rssservice = new RssService()
const openaiservice = new OpenAIService()

const app = express()
const port = process.env.PORT;

// set the view engine to ejs
app.set('view engine', 'ejs');

/**
 * Not used yet
 */
app.use('/api', express.json()).use(cors()).use(ApiController)

/**
 * Homepage
 */
app.get('/', (req, res) => {
    res.render('pages/index', {
        slug: "/",
        flux: rssservice.findAll(),
        tagline: config.tagline
    });
})

/**
 * Articles for a categorie
 */
app.get('/news/:articles(economie|politique|societe)', async (req, res) => {

    const feed = await rssservice.fetch(req.params.articles, req.params.articles)
    res.render('pages/news', {
        slug: req.params.articles,
        flux: rssservice.findAll(),
        feed,
    });
})

/**
 * One Article
 */
app.get('/article/:article', async (req, res) => {

    let article: Article|undefined
    try {
        article = await rssservice.fetchArticle(req.params.article)
    } catch(e) {
        //throw new NotFoundException('Article introuvable')
    }

    let gpt_titre, gpt_contenu, gpt_resume, short_text, trailing_text

    if (article) {
        let hasToBeSaved = false
        if (article?.title && !article.gpt_title) {
            gpt_titre = await openaiservice.rewrite(article.title)
            article.gpt_title = gpt_titre
            hasToBeSaved = true
        }
        if (article?.contenu && !article.gpt_resume) {
            gpt_resume = await openaiservice.rewrite(article.contenu)
            article.gpt_resume = gpt_resume
            hasToBeSaved = true
        }

        if (article?.contenu && !article.gpt_contenu) {
            gpt_contenu = await openaiservice.rewrite(article.contenu, true)
            article.gpt_contenu = gpt_contenu
            hasToBeSaved = true
        }
        if (hasToBeSaved) {
            await rssservice.save(article)
        }

        short_text = article.contenu?.trim().substring(0, config.text_max_length)
        trailing_text = article.contenu?.trim().substring(config.text_max_length)
    }

    
    res.render('pages/article', {
        slug: article?.categorie,
        flux: rssservice.findAll(),
        article,
        short_text,
        trailing_text,
    });
})

app.all('*', UnknownRoutesHandler)

/**
 * Doit être en dernier
 */
app.use(ExceptionsHandler)

app.listen(port, () => console.log('Launched'))
