import argparse
import asyncio
from pathlib import Path

import edge_tts

# Same defaults as run.py
VOICE = "en-GB-SoniaNeural"
RATE = "-5%"
PITCH = "+0Hz"


async def synthesize(text: str, output_file: str, voice: str, rate: str, pitch: str):
    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await communicate.save(output_file)


def main():
    parser = argparse.ArgumentParser(description="Simple text-to-speech CLI (edge-tts)")
    parser.add_argument("--text", required=True, help="Text to synthesize")
    parser.add_argument("--output_file", default="output.mp3", help="Path to save audio (default: output.mp3)")
    parser.add_argument("--voice", default=VOICE, help=f"Voice name (default: {VOICE})")
    parser.add_argument("--rate", default=RATE, help=f"Speech rate adjustment (default: {RATE})")
    parser.add_argument("--pitch", default=PITCH, help=f"Pitch adjustment (default: {PITCH})")

    args = parser.parse_args()

    if not args.text.strip():
        print("Error: --text is empty")
        return

    Path(args.output_file).parent.mkdir(parents=True, exist_ok=True)

    asyncio.run(synthesize(args.text, args.output_file, args.voice, args.rate, args.pitch))
    print(f"Saved: {args.output_file}")


if __name__ == "__main__":
    main()
