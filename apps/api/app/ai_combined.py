"""Combined AI analysis report — synthesizes app.ai_fundamental's and app.ai_technical's
reports into one short verdict, so the AI Analysis tab leads with a single takeaway instead
of making the user read two separate reports and reconcile them itself.

Reuses get_fundamental_report/get_technical_report as-is (each already handles its own
cache-or-generate + BIST/US restriction) — this module only adds the synthesis step on top,
so "generate the combined report" transparently generates the underlying two first if either
isn't cached yet."""

import asyncio
from datetime import datetime

from pydantic import BaseModel

from app.ai_fundamental import FundamentalAIReport, get_fundamental_report
from app.ai_reports import (
    COMPLIANCE_RULES,
    DISCLAIMER_LINE,
    call_gemini,
    ensure_disclaimer,
    get_cached_report,
    language_instruction,
    normalize_locale,
    save_report,
)
from app.ai_technical import TechnicalAIReport, get_technical_report

CACHE_TTL_HOURS = 5.0  # matches technical's TTL — the more volatile of the two inputs

SYSTEM_PROMPT = (
    "Sen Borocean uygulaması için kamuya açık verileri özetleyen bir analiz aracısın. "
    "Sana bir şirketin temel analiz raporu ile bir grafik örüntü modelinin (teknik) "
    "okuması verilecek. Bu ikisini birleştirerek Türkçe, bilgilendirme amaçlı, 2-3 "
    "paragraflık kısa bir özet yaz: finansal veriler ile grafik modelinin okuması "
    "birbiriyle örtüşüyor mu yoksa farklı bir tablo mu çiziyor, objektif olarak açıkla; "
    "iki kaynağın da sınırlarını ve öne çıkan riskleri belirt. Bir sonuç, karar veya "
    "hüküm cümlesi kurma. Yalnızca sana verilen iki rapora dayan. "
    + COMPLIANCE_RULES
    + f" Raporun sonunda ayrı bir satırda mutlaka şunu yaz: '{DISCLAIMER_LINE}'"
)


class CombinedAIReport(BaseModel):
    symbol: str
    exchange: str
    report: str
    generated_at: datetime
    cached: bool


def _build_user_prompt(fundamental: FundamentalAIReport, technical: TechnicalAIReport) -> str:
    return (
        f"Sembol: {fundamental.symbol} ({fundamental.exchange})\n\n"
        f"Temel Analiz Raporu:\n{fundamental.report}\n\n"
        f"Teknik Analiz (Grafik Modeli) Raporu:\n{technical.report}"
    )


async def get_combined_report(
    symbol: str, exchange: str, *, locale: str = "tr"
) -> CombinedAIReport:
    symbol = symbol.strip().upper()
    exchange_filter = exchange.strip().upper()
    locale = normalize_locale(locale)

    cached = await asyncio.to_thread(
        get_cached_report, symbol, exchange_filter, "combined", CACHE_TTL_HOURS, locale
    )
    if cached is not None:
        content, generated_at = cached
        return CombinedAIReport(
            symbol=symbol,
            exchange=exchange_filter,
            report=content["report"],
            generated_at=generated_at,
            cached=True,
        )

    fundamental, technical = await asyncio.gather(
        get_fundamental_report(symbol, exchange_filter, locale=locale),
        get_technical_report(symbol, exchange_filter, locale=locale),
    )

    user_prompt = _build_user_prompt(fundamental, technical)
    system_prompt = SYSTEM_PROMPT + language_instruction(locale)
    report_text = ensure_disclaimer(await call_gemini(system_prompt, user_prompt), locale)

    generated_at = await asyncio.to_thread(
        save_report, symbol, exchange_filter, "combined", {"report": report_text}, locale
    )
    return CombinedAIReport(
        symbol=symbol,
        exchange=exchange_filter,
        report=report_text,
        generated_at=generated_at,
        cached=False,
    )
