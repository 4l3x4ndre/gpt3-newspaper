import { Configuration, OpenAIApi } from "openai";
import { config } from '../config'

export class OpenAIService {

    configuration: Configuration
    openai: OpenAIApi

    constructor() {

        this.configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
          });
        this.openai = new OpenAIApi(this.configuration);

    }

    async rewrite(text: string, resume?: boolean): Promise<string | undefined> {

        const short_text = text.replace(/[«»"]+/g, " ").trim().substring(0, config.text_max_length)
        const completion = await this.openai.createCompletion({
            model: "text-davinci-003",
            prompt: (resume ? config.resume_prompt : config.rewrite_prompt ) + "\n\n" + short_text,
            //temperature: 0.6,
            max_tokens: 1116,
          });

        return completion.data.choices[0]?.text
    }

}