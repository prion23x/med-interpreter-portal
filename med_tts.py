import argparse
import asyncio
import json
import sys
from pathlib import Path

import edge_tts

# Sonia (British English) - same voice as the original script
VOICE = "en-GB-SoniaNeural"
RATE = "-5%"
PITCH = "+0Hz"


def load_terms(json_path: Path):
    """Load a term-list JSON file and return its 'terms' list (or [] if missing/invalid)."""
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        print(f"  [skip] Could not read {json_path.name}: {e}")
        return []

    if not isinstance(data, dict):
        print(f"  [skip] {json_path.name} does not contain a JSON object at top level")
        return []

    terms = data.get("terms")
    if not terms or not isinstance(terms, list):
        print(f"  [info] {json_path.name} has no terms, skipping")
        return []

    return terms


async def synthesize(text: str, out_path: Path, voice: str, rate: str, pitch: str):
    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await communicate.save(str(out_path))


async def process_folder(input_folder: Path, output_folder: Path, voice: str, rate: str,
                          pitch: str, overwrite: bool):
    output_folder.mkdir(parents=True, exist_ok=True)

    json_files = sorted(input_folder.glob("*.json"))
    if not json_files:
        print(f"No .json files found in {input_folder}")
        return

    total_generated = 0
    total_skipped = 0

    for json_path in json_files:
        print(f"Processing {json_path.name} ...")
        terms = load_terms(json_path)
        if not terms:
            continue

        for term in terms:
            if not isinstance(term, dict):
                total_skipped += 1
                continue

            en_text = term.get("en")
            if not en_text or not isinstance(en_text, str) or not en_text.strip():
                total_skipped += 1
                continue

            audio_path = term.get("audio_path")
            if not audio_path or not isinstance(audio_path, str) or not audio_path.strip():
                total_skipped += 1
                continue

            filename = audio_path.strip()
            out_path = output_folder / filename

            if out_path.exists() and not overwrite:
                print(f"  [exists] {filename}")
                continue

            try:
                await synthesize(en_text.strip(), out_path, voice, rate, pitch)
                print(f"  [ok] {filename}")
                total_generated += 1
            except Exception as e:
                print(f"  [error] Failed on '{en_text}': {e}")
                total_skipped += 1

    print(f"\nDone. Generated {total_generated} audio files, skipped {total_skipped}.")


def main():
    parser = argparse.ArgumentParser(
        description="Generate TTS audio (mp3/wav) for the 'en' field of terms in JSON files in a folder."
    )
    parser.add_argument("input_folder", help="Folder containing the term JSON files (e.g. cardiac/)")
    parser.add_argument("output_folder", help="Folder to save generated audio into")
    parser.add_argument("--voice", default=VOICE, help=f"edge-tts voice name (default: {VOICE})")
    parser.add_argument("--rate", default=RATE, help=f"Speech rate adjustment (default: {RATE})")
    parser.add_argument("--pitch", default=PITCH, help=f"Pitch adjustment (default: {PITCH})")
    parser.add_argument("--overwrite", action="store_true",
                         help="Regenerate audio even if the output file already exists")

    args = parser.parse_args()

    input_folder = Path(args.input_folder)
    output_folder = Path(args.output_folder)

    if not input_folder.is_dir():
        print(f"Error: input folder '{input_folder}' does not exist or is not a directory")
        sys.exit(1)

    asyncio.run(process_folder(
        input_folder, output_folder, args.voice, args.rate, args.pitch, args.overwrite
    ))


if __name__ == "__main__":
    main()
