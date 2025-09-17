#!/usr/bin/env bash
set -euo pipefail

# Fetch public Facebook media into ./assets
# Note: Many facebook.com links are post pages, not direct image URLs.
# This script tries yt-dlp if available. Otherwise, prints instructions.

dest_dir="assets"
mkdir -p "$dest_dir"

urls=(
  # About page
  "https://www.facebook.com/watch/?v=386908717486638"
  "https://www.facebook.com/photo/?fbid=203154685869375&set=a.203172125867631"
  "https://www.facebook.com/drelaineloo/posts/pfbid02SHAjkTYftCWprvXHWv464XUBH4M6iQvDfUHKhTzMBSXYicXivH2prtgqCi17UZ6Al"
  "https://www.facebook.com/drelaineloo/posts/pfbid0g9B5RiodyF5FnmJZPDqqPZQdo3yDRBGqAuFp5QYjmJb6u3Qw9fnizLAy42fuqXFUl"
  "https://www.facebook.com/drelaineloo/posts/pfbid0JUAbM1ogSQrFi6GG681XLePWZYTLT7cCHC8RBY1jt7eKiy1SCQJW9EEaxHXCepbsl"
  "https://www.facebook.com/drelaineloo/posts/pfbid06seg2z9XY6SxjXYano6xcR86Pss7M1iMf6csJi1scd7vAD9dCkzL6wYhbsQEBfTBl"
  "https://www.facebook.com/drelaineloo/posts/pfbid0yVYaY53j4HsrVDj9goxufEQkMahyZQELNAiXZUmz4kT4h24c2wuqGrzVtwKswbUQl"
  "https://www.facebook.com/drelaineloo/posts/pfbid02qURCGT6KrnLt6jAa9LWW4q4QySJDujMf2xRuis5tmt7vW1mecaJfwGP7WPc836J7l"
  "https://www.facebook.com/drelaineloo/posts/pfbid02oUDfqHLKkkyop76D6cDYCEfe64VqShBiCRpnzTNYhYix87sNot2NG3ZZRkHuLHp8l"
  "https://www.facebook.com/drelaineloo/posts/pfbid02gDS3tQLgkAvCYqGc4sqNNiKTwuWJYXcU79fDh9NRYqRytDn7V76mfRLtunq98X2Fl"

  # Home page highlights & gallery
  "https://www.facebook.com/photo?fbid=858902599753510&set=pcb.858903089753461"
  "https://www.facebook.com/drelaineloo/posts/pfbid02KJDYsjMFeZctJaPCyWwAw2LyDkdrVkSTrzmysiiDuej9KgTwjfa54TjpD3gSR8zQl"
  "https://www.facebook.com/drelaineloo/posts/pfbid0qXuzrdRUgQzBQHMAqHd5P1za73gfbUo196AHoV99fkW4GZofVdGL7vFCamwntxs5l"
  "https://www.facebook.com/drelaineloo/posts/pfbid027QzXRvrgYobv4WrbShw2MMJBzwcBrBAqX75in9GPUr9exxFsRBmFKtJYewofbzySl"
  "https://www.facebook.com/share/p/15vHkndx9d/"
  "https://www.facebook.com/drelaineloo/posts/pfbid02TgK1jog7phvXSoR6i6csc25m8LjuH34BwopbD1BoatcdaY5pUCvV68AmNkfVqdB5l"
  "https://www.facebook.com/drelaineloo/posts/pfbid02rns8EKQZic36cNQPmoNV4bePiMdFmH6n4RFHXUV2ADvbCHWtLZEPA7DqRZ6ieYC1l"
  "https://www.facebook.com/drelaineloo/posts/pfbid02vPg92HjrSUjR77iurEzeFgWoYbBGeMDErFs8YbfpmBbtopHQe5ibGLwnH1dZ5gZnl"
  "https://www.facebook.com/drelaineloo/posts/pfbid04wi7E1uS7opAL88i4qun9Xvc866zt9Fm1fXghPp1LAp8XtfCALvYT8694mj2D5Ugl"
  "https://www.facebook.com/drelaineloo/posts/pfbid02m4RuqsGoSRf4tjS5RKkdqQwGvkwsfdASqWSa8Sk4a9Xm7w36u2PBKGpLV4RkSqABl"
  "https://www.facebook.com/drelaineloo/posts/pfbid08TH4D2NSSMP4VdgAAPti4fLWezVkkEqVDPeaG9fr6bxdJeKe25NxJze7icCyYYj6l"
  "https://www.facebook.com/drelaineloo/posts/pfbid02NNEJHKCzjGhasgYDukZuStr5k4FoDnu9YpEq5sGGqDioSKbwftmr7FJNUAbyfuaGl"
  "https://www.facebook.com/drelaineloo/posts/pfbid02NkWUNfB27qWhnw7GNHPXxbihY9AtF8BX7vHuEFXJMsNiAikv2SJmQ2mjcfgiBdExl"

  # Media page samples
  "https://www.facebook.com/drelaineloo/posts/pfbid02DM1DGLGkukDUz59TcPVbo3MDDbPG2uLi8FdWzundCDQjDYSgFGya9aQZTFDS4Me7l"
  "https://www.facebook.com/drelaineloo/posts/pfbid028FbDLt5HqFxv6K8QmnB8dY3UQp7wCvUbXhk3HfNTSU58gxCNyveUomvso1yyzSR3l"
  "https://www.facebook.com/drelaineloo/posts/pfbid0MPDtVWVhiMiQJNLHfQiEsb7dFQzgpMXic2dnyuS2aVkJXuLgPNH9m3Pb6D65L1Y7l"
  "https://www.facebook.com/drelaineloo/posts/pfbid02vPg92HjrSUjR77iurEzeFgWoYbBGeMDErFs8YbfpmBbtopHQe5ibGLwnH1dZ5gZnl"
  "https://www.facebook.com/drelaineloo/posts/pfbid02xPYiBKWjSR2kh5RRc255jU1quoSmRppDuchgwW349nYo4YqYwKNwTxkejZb9xhTUl"
  "https://www.facebook.com/drelaineloo/posts/pfbid0VqMiX5kEEk3HtqCC1HEnXZW9k1rXZUbbRbB9VpcYu7PiuBfM7GwFQNCps6VG6Gpsl"
  "https://www.facebook.com/drelaineloo/posts/pfbid04wi7E1uS7opAL88i4qun9Xvc866zt9Fm1fXghPp1LAp8XtfCALvYT8694mj2D5Ugl"
  "https://www.facebook.com/drelaineloo/posts/pfbid02Fd3De87BUFkDP3LrZDn7f1cc5evYym7pHoQprK6qwJEb9AcoFQ7yeaaAHRVwBic4l"
  "https://www.facebook.com/drelaineloo/posts/pfbid02Cg8DYwwtaDahusANLHmyuiBh3WGznzvUhbDKokXnpAWhD2wsDvr3x46rEG5sEiJ8l"
  "https://www.facebook.com/drelaineloo/posts/pfbid02m4RuqsGoSRf4tjS5RKkdqQwGvkwsfdASqWSa8Sk4a9Xm7w36u2PBKGpLV4RkSqABl"
  "https://www.facebook.com/drelaineloo/posts/pfbid02KJDYsjMFeZctJaPCyWwAw2LyDkdrVkSTrzmysiiDuej9KgTwjfa54TjpD3gSR8zQl"
  "https://www.facebook.com/drelaineloo/posts/pfbid0qXuzrdRUgQzBQHMAqHd5P1za73gfbUo196AHoV99fkW4GZofVdGL7vFCamwntxs5l"
  "https://www.facebook.com/drelaineloo/posts/pfbid027QzXRvrgYobv4WrbShw2MMJBzwcBrBAqX75in9GPUr9exxFsRBmFKtJYewofbzySl"
  "https://www.facebook.com/drelaineloo/posts/pfbid0Gr8ot3hXRzm824PxPpFeuyjDX8FG8PN5bWoADz9cZaEuSXQo2e9BeW9sxzCiWCral"
  "https://www.facebook.com/drelaineloo/posts/pfbid0rbcmGfZwXczU9FLZKQHonWL24JxCX6FnR1w44q3traByYxJZsQYoKgiYkpCd6gdFl"
  "https://www.facebook.com/drelaineloo/posts/pfbid025kn5k9J8p67hsC47K4k56m948a1cM5TpsRzP5WBbXueUaXi63obduxvbSQqR49Uwl"
  "https://www.facebook.com/drelaineloo/posts/pfbid05oqUVogtQBGSw95tkuzxdyETxkPMQeqzq1D8nUx6iiMgZ4tXBpXFtYzwNpoSxAJVl"
  "https://www.facebook.com/drelaineloo/posts/pfbid0Y8V7bNQbm266ZT1cgw8rd1oQSsMwH5gjvrZdRWshhi1MrdHGvSmqdSzaWsQz62Jgl"
  "https://www.facebook.com/drelaineloo/posts/pfbid02UudG9PA3tJHtHC69fBgMXGRhaveQNPoBRyBnreKokrZ4FibYF51gYEMJYERkjfTNl"
  "https://www.facebook.com/drelaineloo/posts/pfbid02gQuAWvE84eYFZEWDHS1FtP5PaoEEgwRnZ1ZMHbj2VRv8LzL4ZTa6my2tyGoe9eACl"
  "https://www.facebook.com/drelaineloo/posts/pfbid0rkTt9YytQQx6H7WLdq3b4dof6Ab7VzZX4PUTrY38YiEYShgxF8Qg6La5bPP182ERl"
  "https://www.facebook.com/drelaineloo/posts/pfbid08TH4D2NSSMP4VdgAAPti4fLWezVkkEqVDPeaG9fr6bxdJeKe25NxJze7icCyYYj6l"
  "https://www.facebook.com/drelaineloo/posts/pfbid02NNEJHKCzjGhasgYDukZuStr5k4FoDnu9YpEq5sGGqDioSKbwftmr7FJNUAbyfuaGl"
  "https://www.facebook.com/drelaineloo/posts/pfbid02NkWUNfB27qWhnw7GNHPXxbihY9AtF8BX7vHuEFXJMsNiAikv2SJmQ2mjcfgiBdExl"
  "https://www.facebook.com/drelaineloo/posts/pfbid02b3sMRFTnPZMes5tKHmLXoG4EPcohkeu1TaDswxqTsdKrLsXcJgbfFEiYcnBYDFi1l"
)

if ! command -v yt-dlp >/dev/null 2>&1; then
  echo "yt-dlp is required to fetch Facebook media automatically." >&2
  echo "Install: pipx install yt-dlp  OR  pip install --user yt-dlp" >&2
  echo "Then run: bash scripts/fetch_images.sh" >&2
  exit 1
fi

for u in "${urls[@]}"; do
  echo "Fetching: $u"
  yt-dlp -o "$dest_dir/%(title).50s-%(id)s.%(ext)s" \
         --restrict-filenames --no-playlist --no-warnings \
         --embed-thumbnail --convert-thumbnails jpg \
         "$u" || echo "Skip (failed): $u"
done

echo "Done. Check the assets/ folder for downloaded media."

