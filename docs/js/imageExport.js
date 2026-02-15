// 차트/지도 이미지 저장 기능
(function () {
    'use strict';

    var SCALE = 3;
    var PADDING = 20;
    var TITLE_FONT = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    var TABLE_FONT = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    var TABLE_HEADER_FONT = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    function generateFilename(title) {
        var date = new Date();
        var dateStr = date.getFullYear() +
            String(date.getMonth() + 1).padStart(2, '0') +
            String(date.getDate()).padStart(2, '0');
        var safeName = title.replace(/[^\w가-힣]/g, '_').replace(/_+/g, '_');
        return safeName + '_' + dateStr + '.png';
    }

    function triggerDownload(dataUrl, filename) {
        var link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // 카드 패널 전체를 PNG로 다운로드
    function downloadCardAsPng(cardEl, title) {
        if (!cardEl) return;

        var cardRect = cardEl.getBoundingClientRect();
        var chartCanvas = cardEl.querySelector('canvas');
        var svgContainer = cardEl.querySelector('.hexmap-canvas');
        var table = cardEl.querySelector('table');

        // 제목 텍스트 추출
        var titleEl = cardEl.querySelector('h3, h4');
        var titleText = titleEl ? titleEl.textContent.trim() : title;

        // 부제목 (날짜 등)
        var subtitleEl = cardEl.querySelector('.hexmap-date');
        var subtitleText = subtitleEl ? subtitleEl.textContent.trim() : '';

        // 테이블 데이터 읽기
        var tableData = table ? readTableData(table) : null;

        // SVG 지도인 경우
        if (svgContainer) {
            downloadCardWithSvg(svgContainer, titleText, subtitleText, title);
            return;
        }

        // 크기 계산
        var contentWidth = chartCanvas ? chartCanvas.getBoundingClientRect().width : (cardRect.width - PADDING * 2);
        var imgWidth = contentWidth + PADDING * 2;
        var yPos = PADDING;

        // 제목 높이
        var titleHeight = 24;
        yPos += titleHeight + 10;

        // 차트 높이
        var chartHeight = 0;
        if (chartCanvas) {
            chartHeight = chartCanvas.getBoundingClientRect().height;
            yPos += chartHeight + 10;
        }

        // 테이블 높이 계산
        var tableHeight = 0;
        if (tableData) {
            var rowH = 28;
            var headerH = 32;
            tableHeight = headerH + tableData.rows.length * rowH + 10;
            yPos += tableHeight;
        }

        var imgHeight = yPos + PADDING;

        // 캔버스 생성
        var out = document.createElement('canvas');
        out.width = imgWidth * SCALE;
        out.height = imgHeight * SCALE;
        var ctx = out.getContext('2d');
        ctx.scale(SCALE, SCALE);

        // 배경
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, imgWidth, imgHeight);

        var curY = PADDING;

        // 제목
        ctx.fillStyle = '#2d3748';
        ctx.font = TITLE_FONT;
        ctx.fillText(titleText, PADDING, curY + 16);
        curY += titleHeight + 10;

        // 차트
        if (chartCanvas) {
            var cw = chartCanvas.getBoundingClientRect().width;
            var ch = chartCanvas.getBoundingClientRect().height;
            ctx.drawImage(chartCanvas, PADDING, curY, cw, ch);
            curY += ch + 10;
        }

        // 테이블
        if (tableData) {
            drawTable(ctx, tableData, PADDING, curY, contentWidth);
        }

        triggerDownload(out.toDataURL('image/png'), generateFilename(title));
    }

    // 테이블 DOM에서 데이터 읽기
    function readTableData(table) {
        var headers = [];
        var rows = [];

        // 헤더 읽기
        var headerCells = table.querySelectorAll('thead th, thead td');
        if (headerCells.length === 0) {
            headerCells = table.querySelectorAll('tr:first-child th, tr:first-child td');
        }
        headerCells.forEach(function (th) {
            headers.push(th.textContent.trim());
        });

        // 바디 읽기
        var bodyRows = table.querySelectorAll('tbody tr');
        bodyRows.forEach(function (tr) {
            var cells = [];
            tr.querySelectorAll('td, th').forEach(function (td) {
                var computed = window.getComputedStyle(td);
                cells.push({
                    text: td.textContent.trim(),
                    bgColor: td.style.backgroundColor || computed.backgroundColor,
                    textColor: td.style.color || computed.color
                });
            });
            rows.push(cells);
        });

        return { headers: headers, rows: rows };
    }

    // 테이블을 canvas에 그리기
    function drawTable(ctx, tableData, x, y, maxWidth) {
        var headers = tableData.headers;
        var rows = tableData.rows;
        if (headers.length === 0 && rows.length === 0) return;

        var colCount = Math.max(headers.length, rows.length > 0 ? rows[0].length : 0);
        if (colCount === 0) return;

        // 첫 번째 열(지역명)은 넓게, 나머지 데이터 열은 균등 분배
        var firstColWidth = Math.max(120, maxWidth * 0.22);
        var dataColWidth = colCount > 1 ? (maxWidth - firstColWidth) / (colCount - 1) : 0;
        var rowH = 28;
        var headerH = 32;

        function getColX(colIdx) {
            if (colIdx === 0) return x;
            return x + firstColWidth + (colIdx - 1) * dataColWidth;
        }
        function getColW(colIdx) {
            return colIdx === 0 ? firstColWidth : dataColWidth;
        }

        // 헤더 배경
        ctx.fillStyle = '#f7fafc';
        ctx.fillRect(x, y, maxWidth, headerH);

        // 헤더 텍스트
        ctx.fillStyle = '#4a5568';
        ctx.font = TABLE_HEADER_FONT;
        ctx.textBaseline = 'middle';
        for (var h = 0; h < headers.length; h++) {
            var w = getColW(h);
            var cx = getColX(h);
            if (h === 0) {
                ctx.textAlign = 'left';
                ctx.fillText(headers[h], cx + 8, y + headerH / 2);
            } else {
                ctx.textAlign = 'center';
                ctx.fillText(truncateText(ctx, headers[h], w - 4), cx + w / 2, y + headerH / 2);
            }
        }

        // 헤더 하단 선
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + headerH);
        ctx.lineTo(x + maxWidth, y + headerH);
        ctx.stroke();

        // 데이터 행
        var curY = y + headerH;
        for (var r = 0; r < rows.length; r++) {
            var cells = rows[r];
            for (var c = 0; c < cells.length; c++) {
                var cell = cells[c];
                var colX = getColX(c);
                var colW = getColW(c);

                // 셀 배경색 (지역명 열 제외)
                if (c > 0 && cell.bgColor && cell.bgColor !== 'rgba(0, 0, 0, 0)' && cell.bgColor !== 'transparent') {
                    ctx.fillStyle = cell.bgColor;
                    ctx.fillRect(colX, curY, colW, rowH);
                }

                // 셀 텍스트
                ctx.fillStyle = cell.textColor || '#2d3748';
                ctx.font = TABLE_FONT;
                ctx.textBaseline = 'middle';
                if (c === 0) {
                    // 지역명: 왼쪽 정렬, 잘림 없이 충분한 너비
                    ctx.textAlign = 'left';
                    ctx.fillText(cell.text, colX + 8, curY + rowH / 2);
                } else {
                    ctx.textAlign = 'center';
                    ctx.fillText(truncateText(ctx, cell.text, colW - 4), colX + colW / 2, curY + rowH / 2);
                }
            }

            // 행 구분선
            ctx.strokeStyle = '#edf2f7';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(x, curY + rowH);
            ctx.lineTo(x + maxWidth, curY + rowH);
            ctx.stroke();

            curY += rowH;
        }

        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    // 텍스트가 길면 잘라내기
    function truncateText(ctx, text, maxW) {
        if (ctx.measureText(text).width <= maxW) return text;
        while (text.length > 0 && ctx.measureText(text + '…').width > maxW) {
            text = text.slice(0, -1);
        }
        return text + '…';
    }

    // SVG 지도 카드 다운로드
    function downloadCardWithSvg(svgContainer, titleText, subtitleText, title) {
        var svgEl = svgContainer.querySelector('svg');
        if (!svgEl) return;

        var svgClone = svgEl.cloneNode(true);
        var svgRect = svgEl.getBoundingClientRect();
        svgClone.setAttribute('width', svgRect.width);
        svgClone.setAttribute('height', svgRect.height);
        inlineSvgStyles(svgEl, svgClone);

        var svgData = new XMLSerializer().serializeToString(svgClone);
        var svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        var url = URL.createObjectURL(svgBlob);

        var img = new Image();
        img.onload = function () {
            var contentWidth = svgRect.width;
            var imgWidth = contentWidth + PADDING * 2;
            var titleH = 24;
            var subtitleH = subtitleText ? 20 : 0;
            var imgHeight = PADDING + titleH + 8 + subtitleH + svgRect.height + PADDING;

            var out = document.createElement('canvas');
            out.width = imgWidth * SCALE;
            out.height = imgHeight * SCALE;
            var ctx = out.getContext('2d');
            ctx.scale(SCALE, SCALE);

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, imgWidth, imgHeight);

            var curY = PADDING;

            // 제목
            ctx.fillStyle = '#2d3748';
            ctx.font = TITLE_FONT;
            ctx.fillText(titleText, PADDING, curY + 16);
            curY += titleH + 8;

            // 부제목
            if (subtitleText) {
                ctx.fillStyle = '#718096';
                ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.fillText(subtitleText, PADDING, curY + 13);
                curY += subtitleH;
            }

            // SVG 지도
            ctx.drawImage(img, PADDING, curY, svgRect.width, svgRect.height);
            URL.revokeObjectURL(url);

            triggerDownload(out.toDataURL('image/png'), generateFilename(title));
        };
        img.onerror = function () {
            console.error('SVG 이미지 로드 실패');
            URL.revokeObjectURL(url);
        };
        img.src = url;
    }

    // SVG 인라인 스타일
    function inlineSvgStyles(origSvg, cloneSvg) {
        var allOrig = origSvg.querySelectorAll('*');
        var allClone = cloneSvg.querySelectorAll('*');
        for (var i = 0; i < allOrig.length; i++) {
            if (!allClone[i]) continue;
            var computed = window.getComputedStyle(allOrig[i]);
            var props = ['fill', 'stroke', 'stroke-width', 'font-size', 'font-family',
                'font-weight', 'text-anchor', 'dominant-baseline', 'opacity', 'display',
                'color', 'visibility'];
            for (var j = 0; j < props.length; j++) {
                var val = computed.getPropertyValue(props[j]);
                if (val) allClone[i].style.setProperty(props[j], val);
            }
        }
    }

    // 전역에 내보내기
    window.ImageExport = {
        downloadCardAsPng: downloadCardAsPng
    };
})();
