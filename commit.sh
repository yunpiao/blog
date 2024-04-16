git add -A
time=$(date "+%Y%m%d-%H%M%S")
git commit -m "自动 commit, commit 时间: $time"
git push -f
