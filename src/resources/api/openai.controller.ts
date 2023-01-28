import { Configuration, OpenAIApi } from "openai";
import { Router } from 'express'
import { BadRequestException, NotFoundException } from '../../utils/exceptions'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const ApiController = Router()

export { ApiController };