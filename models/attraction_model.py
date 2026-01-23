import json
from mysql.connector import Error

class AttractionModel:
    @staticmethod
    def get_all_mrt(cur):
        cur.execute("""
			SELECT mrt, COUNT(*) AS cnt FROM spot
			WHERE mrt IS NOT NULL AND mrt <> ''
			GROUP BY mrt ORDER BY cnt DESC
		""")
        data = cur.fetchall()
        return [d["mrt"] for d in data]
    
    @staticmethod
    def get_all_categories(cur):
        cur.execute("SELECT DISTINCT category FROM spot")
        data = cur.fetchall()
        return [d["category"] for d in data]
    
    @staticmethod
    def get_attraction(cur, page, category=None, keyword=None):
        PAGE_AMOUNT = 8
        offset = page * PAGE_AMOUNT
        # 兩個sql，一個搜尋，另一個抓搜尋結果總數
        sql = '''SELECT * FROM spot'''
        count_sql = '''SELECT COUNT(*) AS cnt FROM spot'''
        # 篩選條件及放入參數
        condition = []
        params = []

        # 共同搜尋條件
        if category:
            condition.append("category = %s")
            params.append(category)
        if keyword:
            condition.append("(mrt = %s OR name LIKE %s)")
            params.append(keyword)
            params.append(f'%{keyword}%')
        if condition:
            sql = sql + " WHERE " + " AND ".join(condition)
            count_sql = count_sql + " WHERE " + " AND ".join(condition)

        # 先抓結果總數，因為後面要補條件LIMIT, OFFSET，不適用於COUNT(*)
        cur.execute(count_sql, params)
        total_data = cur.fetchone()
        total = total_data["cnt"]
        # 如果找不到資料，直接return
        if total == 0: return None, 0

        # 搜尋結果補上每頁顯示的條件
        sql = sql + " ORDER BY id LIMIT %s OFFSET %s"
        params.append(PAGE_AMOUNT)
        params.append(offset)

        cur.execute(sql, params)
        data = cur.fetchall()

        # 處理image裡的JSON字串
        for row in data:
            row_image = row.get("images")
            # 如果沒有就設為空陣列
            if not row_image:
                row["images"] = []
            row["images"] = json.loads(row_image)
        return data, total
    
    @staticmethod
    def get_by_id(cur, attraction_id):
        sql = 'SELECT * FROM spot WHERE id = %s'
        cur.execute(sql, (attraction_id,))
        data = cur.fetchone()
        # 處理image裡的JSON字串
        data_image = data.get("images")
        if data and data.get("images"):
            data["images"] = json.loads(data["images"])
        return data