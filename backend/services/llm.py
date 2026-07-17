import google.generativeai as genai


def configure_gemini(api_key: str):
    genai.configure(api_key=api_key)


def generate_answer(
    prompt: str,
    model_name: str = "gemini-3.5-flash",
    temperature: float = 0.2,
    max_output_tokens: int = 2048,
) -> dict:
    model = genai.GenerativeModel(model_name)

    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_output_tokens,
        ),
        safety_settings=[
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ],
    )

    answer = ""
    if response.text:
        answer = response.text
    elif response.candidates and response.candidates[0].content.parts:
        answer = "".join(p.text for p in response.candidates[0].content.parts if hasattr(p, "text"))

    usage = response.usage_metadata
    return {
        "answer": answer,
        "tokens_used": usage.total_token_count if usage else 0,
        "prompt_tokens": usage.prompt_token_count if usage else 0,
        "completion_tokens": usage.candidates_token_count if usage else 0,
    }


def generate_answer_streaming(
    prompt: str,
    model_name: str = "gemini-3.5-flash",
    temperature: float = 0.2,
    max_output_tokens: int = 2048,
):
    model = genai.GenerativeModel(model_name)

    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_output_tokens,
        ),
        safety_settings=[
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ],
        stream=True,
    )

    for chunk in response:
        if chunk.text:
            yield chunk.text
